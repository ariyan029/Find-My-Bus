import type { BusRoute, BusStop, LiveBus, RouteStopPoint } from "./data";
import type { Occupancy, TelemetrySource } from "./enums";

const EARTH_RADIUS_KM = 6371;
const ORDERED_STOPS_CACHE = new WeakMap<RouteStopPoint[], RouteStopPoint[]>();

interface RouteBBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
const ROUTE_BBOX_CACHE = new WeakMap<BusRoute, RouteBBox>();

function getRouteBBox(route: BusRoute): RouteBBox | null {
  const cached = ROUTE_BBOX_CACHE.get(route);
  if (cached) return cached;
  const pts = route.stopPoints;
  if (!pts || pts.length === 0) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const p of pts) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  const pad = 0.022; // ~2.4 km bounding pad
  const box: RouteBBox = {
    minLat: minLat - pad,
    maxLat: maxLat + pad,
    minLng: minLng - pad,
    maxLng: maxLng + pad,
  };
  ROUTE_BBOX_CACHE.set(route, box);
  return box;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in kilometers between two WGS84 coordinates. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function segmentBearingDeg(a: RouteStopPoint, b: RouteStopPoint): number {
  const cosLat = Math.cos(toRad((a.lat + b.lat) / 2));
  const dLng = (b.lng - a.lng) * cosLat;
  const dLat = b.lat - a.lat;
  return ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
}

function angularDifferenceDeg(a: number, b: number): number {
  return Math.abs((((a - b) % 360) + 540) % 360 - 180);
}

export interface BusProgressResult {
  originStop: string;
  nextStop: string;
  destination: string;
  distanceToNextStopKm: number;
  etaNextStopMins: number;
  progressPct: number;
  direction?: "forward" | "return";
}

/**
 * Project a bus's live GPS position onto its ordered corridor stops to derive
 * the next upcoming stop, ETA, distance, and route completion percentage.
 * Automatically detects return-direction trips when heading opposes the forward corridor.
 */
export function computeBusProgress(
  lat: number,
  lng: number,
  speedKmh: number,
  stopPoints: RouteStopPoint[] | undefined,
  fallbackOrigin: string,
  fallbackDestination: string,
  heading?: number | null
): BusProgressResult {
  if (!stopPoints || stopPoints.length < 2) {
    return {
      originStop: fallbackOrigin,
      nextStop: fallbackDestination,
      destination: fallbackDestination,
      distanceToNextStopKm: 1.5,
      etaNextStopMins: 5,
      progressPct: 50,
      direction: "forward",
    };
  }

  let ordered = ORDERED_STOPS_CACHE.get(stopPoints);
  if (!ordered) {
    ordered = [...stopPoints].sort((a, b) => a.sequence - b.sequence);
    ORDERED_STOPS_CACHE.set(stopPoints, ordered);
  }

  // Find the closest point along any consecutive stop-to-stop segment.
  let bestSegIdx = 0;
  let bestT = 0;
  let bestDistSq = Infinity;

  const cosLat = Math.cos(toRad(lat));
  for (let i = 0; i < ordered.length - 1; i++) {
    const a = ordered[i];
    const b = ordered[i + 1];
    const ax = a.lng * cosLat;
    const ay = a.lat;
    const bx = b.lng * cosLat;
    const by = b.lat;
    const px = lng * cosLat;
    const py = lat;

    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq)) : 0;
    const projX = ax + t * dx;
    const projY = ay + t * dy;
    const distSq = (px - projX) ** 2 + (py - projY) ** 2;

    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestSegIdx = i;
      bestT = t;
    }
  }

  // Detect return trips when heading points significantly opposite to the segment bearing.
  let isReturn = false;
  if (heading != null && Number.isFinite(heading) && (speedKmh >= 3 || heading !== 0)) {
    const segBearing = segmentBearingDeg(ordered[bestSegIdx], ordered[bestSegIdx + 1]);
    if (angularDifferenceDeg(heading, segBearing) > 105) {
      isReturn = true;
    }
  }

  const originStop = isReturn ? ordered[ordered.length - 1].name : ordered[0].name;
  const destination = isReturn ? ordered[0].name : ordered[ordered.length - 1].name;

  const nextIdx = isReturn
    ? bestT < 0.08 && bestSegIdx - 1 >= 0
      ? bestSegIdx - 1
      : bestSegIdx
    : bestT > 0.92 && bestSegIdx + 2 < ordered.length
      ? bestSegIdx + 2
      : bestSegIdx + 1;

  const nextPoint = ordered[nextIdx];

  const rawDistKm = haversineKm(lat, lng, nextPoint.lat, nextPoint.lng);
  const distanceToNextStopKm = Math.round(rawDistKm * 10) / 10;

  // Use live speed when moving; fall back to realistic urban Kolkata bus speed (22 km/h) when stopped at signals.
  const effectiveSpeedKmh =
    speedKmh >= 8 ? Math.min(55, Math.max(12, speedKmh)) : 22;
  const etaNextStopMins = Math.max(1, Math.round((rawDistKm / effectiveSpeedKmh) * 60));

  const forwardRatio = (bestSegIdx + bestT) / (ordered.length - 1);
  const ratio = isReturn ? 1 - forwardRatio : forwardRatio;
  const progressPct = Math.max(5, Math.min(98, Math.round(ratio * 100)));

  return {
    originStop,
    nextStop: nextPoint.name,
    destination,
    distanceToNextStopKm,
    etaNextStopMins,
    progressPct,
    direction: isReturn ? "return" : "forward",
  };
}

export interface JourneyScheduleInfo {
  inServiceNow: boolean;
  waitMins: number;
  frequencyMins: number;
  departureTimeLabel: string;
  arrivalTimeLabel: string;
  upcomingDepartures: string[];
  serviceWindow: string;
  trafficNote: "Peak Hour" | "Normal Traffic" | "Light Traffic" | "Next Morning Service";
}

export interface LiveRouteMatch {
  busId: string;
  busNumber: string;
  regNumber: string;
  nextStop: string;
  etaNextStopMins: number;
  occupancy: Occupancy;
  telemetrySource: TelemetrySource;
}

export interface PlacePoint {
  lat: number;
  lng: number;
  label: string;
  source: "catalog" | "landmark" | "nominatim";
}

export interface DirectJourney {
  route: BusRoute;
  direction: "forward" | "return";
  fromStopName: string;
  toStopName: string;
  stopsBetween: number;
  estMins: number;
  estFare: number;
  schedule: JourneyScheduleInfo;
  liveMatch?: LiveRouteMatch;
  corridorMatchNote?: string;
  corridorWalkKm?: number;
}

export interface ConnectingJourney {
  firstLeg: DirectJourney;
  secondLeg: DirectJourney;
  transferStop: string;
  transferWaitMins: number;
  totalMins: number;
  totalFare: number;
  departureTimeLabel: string;
  arrivalTimeLabel: string;
}

export interface JourneySearchResult {
  resolvedFrom: string | null;
  resolvedTo: string | null;
  fromSource?: "catalog" | "landmark" | "nominatim";
  toSource?: "catalog" | "landmark" | "nominatim";
  direct: DirectJourney[];
  connecting: ConnectingJourney[];
  searchTimeLabel: string;
}

const KOLKATA_LANDMARKS: Array<{ keywords: string[]; label: string; lat: number; lng: number }> = [
  { keywords: ["adamas", "adamas university", "barbaria"], label: "Adamas University (Barbaria)", lat: 22.7397, lng: 88.4575 },
  { keywords: ["brainware", "brainware university"], label: "Brainware University (Barasat)", lat: 22.7318, lng: 88.4990 },
  { keywords: ["barasat court", "kachhari maidan", "kachari maidan"], label: "Barasat Court / Kachhari Maidan", lat: 22.7215, lng: 88.4805 },
  { keywords: ["city centre 1", "cc1", "salt lake city centre"], label: "City Centre 1 (Salt Lake)", lat: 22.5882, lng: 88.4084 },
  { keywords: ["south city", "south city mall"], label: "South City Mall", lat: 22.5016, lng: 88.3617 },
  { keywords: ["quest mall"], label: "Quest Mall (Park Circus)", lat: 22.5390, lng: 88.3657 },
  { keywords: ["axis mall"], label: "Axis Mall (New Town)", lat: 22.5795, lng: 88.4599 },
  { keywords: ["biswa bangla gate", "narkelbagan", "narkel bagan"], label: "Biswa Bangla Gate (Narkelbagan)", lat: 22.5821, lng: 88.4660 },
  { keywords: ["sskm", "pg hospital"], label: "SSKM / IPGMER Hospital", lat: 22.5400, lng: 88.3418 },
  { keywords: ["apollo", "apollo hospital", "apollo gleneagles"], label: "Apollo Gleneagles Hospital", lat: 22.5744, lng: 88.4017 },
  { keywords: ["victoria memorial", "victoria"], label: "Victoria Memorial", lat: 22.5450, lng: 88.3426 },
  { keywords: ["st xaviers", "st. xavier", "xaviers"], label: "St. Xavier's (Park Street)", lat: 22.5491, lng: 88.3562 },
  { keywords: ["presidency university", "presidency"], label: "Presidency University", lat: 22.5763, lng: 88.3632 },
  { keywords: ["techno india", "iem", "salt lake"], label: "Techno India / IEM Sector V", lat: 22.5758, lng: 88.4278 },
  { keywords: ["unitech", "candor", "infospace"], label: "Candor / Unitech New Town", lat: 22.5800, lng: 88.4810 },
  { keywords: ["heritage", "heritage institute"], label: "Heritage Institute (Anandapur)", lat: 22.5171, lng: 88.4184 },
  { keywords: ["nrs", "nrs hospital"], label: "NRS Medical College (Sealdah)", lat: 22.5628, lng: 88.3694 },
  { keywords: ["rg kar", "r.g. kar"], label: "R.G. Kar Medical College", lat: 22.6042, lng: 88.3778 },
  { keywords: ["howrah bridge", "rabindra setu"], label: "Howrah Bridge", lat: 22.5852, lng: 88.3468 },
  { keywords: ["acropolis", "acropolis mall"], label: "Acropolis Mall (Kasba)", lat: 22.5150, lng: 88.3932 },
  { keywords: ["mani square", "mani square mall"], label: "Mani Square (EM Bypass)", lat: 22.5778, lng: 88.4014 },
];

const STOP_ALIASES: Record<string, string> = {
  dharmatala: "esplanade bus terminus",
  esplanade: "esplanade bus terminus",
  howrah: "howrah station",
  sealdah: "sealdah station",
  "sector 5": "salt lake sector v",
  "sector v": "salt lake sector v",
  sec5: "salt lake sector v",
  wipro: "salt lake sector v",
  karunamoyee: "salt lake karunamoyee",
  "new town": "new town shapoorji",
  newtown: "new town shapoorji",
  shapoorji: "new town shapoorji",
  sapoorji: "new town shapoorji",
  airport: "netaji subhash airport (gate 1)",
  ccu: "netaji subhash airport (gate 1)",
  dumdum: "nagerbazar crossing",
  jadavpur: "jadavpur 8b bus stand",
  "8b": "jadavpur 8b bus stand",
  gariahat: "gariahat junction",
  garia: "garia bus stand",
  shyambazar: "shyambazar five point",
  ultadanga: "ultadanga hudco",
  ruby: "ruby hospital crossing",
  "science city": "science city more",
  "park street": "park street crossing",
  "park circus": "park circus 7 point",
  exide: "exide / rabindra sadan",
  "rabindra sadan": "exide / rabindra sadan",
  hazra: "hazra more",
  rashbehari: "rashbehari crossing",
  kalighat: "rashbehari crossing",
  tollygunge: "tollygunge phari",
  dunlop: "dunlop crossing",
  barrackpore: "barrackpore chiriamore",
  barasat: "barasat chapadali",
  champadali: "barasat chapadali",
  "champadali more": "barasat chapadali",
  chapadali: "barasat chapadali",
  dakbanglow: "barasat dakbanglow",
  "dak banglow": "barasat dakbanglow",
  "barasat dak banglow": "barasat dakbanglow",
  "colony more": "barasat colony more",
  sethpukur: "sethpukur",
  hatkhola: "hatkhola more",
  "dakshin para": "dakshin para",
  hridaypur: "hridaypur",
  madhyamgram: "madhyamgram chowmatha",
  "bt college": "b.t. college (new barrackpore)",
  birati: "birati more",
  haldiram: "haldiram (vip road)",
  teghoria: "teghoria",
  baguiati: "baguiati crossing",
  kestopur: "kestopur",
  "dum dum park": "dum dum park",
  sreebhumi: "sreebhumi",
  maniktala: "maniktala crossing",
  "mg road": "m.g. road crossing",
  barabazar: "barabazar",
  dakshineswar: "dakshineswar",
  sodepur: "sodepur traffic more",
  duttapukur: "duttapukur",
  nilganj: "nilganj more",
  deganga: "deganga",
  berachampa: "berachampa",
  "bbd bag": "b.b.d. bag (dalhousie)",
  dalhousie: "b.b.d. bag (dalhousie)",
  "college street": "college street",
  rajabazar: "rajabazar crossing",
  phoolbagan: "phoolbagan crossing",
  beleghata: "beleghata main rd",
  kankurgachi: "kankurgachi crossing",
  belgachia: "belgachia metro",
  patipukur: "patipukur",
  bangur: "bangur avenue",
  hatibagan: "hatibagan",
  bagbazar: "bagbazar",
  sinthi: "sinthi more",
  baranagar: "baranagar bazar",
  kamarhati: "kamarhati",
  khardah: "khardah",
  titagarh: "titagarh",
  "belur math": "belur math",
  belur: "belur math",
  bally: "bally khal",
  "howrah maidan": "howrah maidan",
  nabanna: "nabanna (mandirtala)",
  mandirtala: "nabanna (mandirtala)",
  shibpur: "botanical garden (shibpur)",
  "botanical garden": "botanical garden (shibpur)",
  mominpore: "mominpore",
  kidderpore: "kidderpore crossing",
  golpark: "golpark",
  dhakuria: "dhakuria",
  baghajatin: "baghajatin",
  ranikuthi: "ranikuthi",
  naktala: "naktala",
  kasba: "kasba / anandapur",
  anandapur: "kasba / anandapur",
  topsia: "topsia",
  "nicco park": "nicco park",
  thakurpukur: "thakurpukur bazar",
  sakherbazar: "sakherbazar (behala)",
  amtala: "amtala",
  basirhat: "basirhat",
  chanditala: "chanditala",
  behala: "behala chowrasta",
  joka: "joka / pailan",
  pailan: "joka / pailan",
  santragachi: "santragachi station",
  alipore: "alipore zoo / hastings",
  "eco park": "city centre ii / eco park",
  "city centre 2": "city centre ii / eco park",
  cc2: "city centre ii / eco park",
};

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function expandQueryAlias(query: string): string {
  const q = normalizeText(query);
  return STOP_ALIASES[q] ?? q;
}

function parseClockMins(hhmm: string | undefined, fallbackMins: number): number {
  if (!hhmm) return fallbackMins;
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return fallbackMins;
  return h * 60 + m;
}

function formatClockFromMins(totalMinsFromMidnight: number): string {
  const wrapped = ((Math.round(totalMinsFromMidnight) % 1440) + 1440) % 1440;
  const h24 = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function getTrafficContext(minuteOfDay: number): {
  isPeak: boolean;
  multiplier: number;
  label: "Peak Hour" | "Normal Traffic" | "Light Traffic";
} {
  const morningPeak = minuteOfDay >= 9 * 60 && minuteOfDay <= 11 * 60 + 30;
  const eveningPeak = minuteOfDay >= 17 * 60 + 30 && minuteOfDay <= 20 * 60 + 30;
  if (morningPeak || eveningPeak) {
    return { isPeak: true, multiplier: 1.15, label: "Peak Hour" };
  }
  const lateOrEarly = minuteOfDay < 6 * 60 + 30 || minuteOfDay >= 21 * 60 + 30;
  if (lateOrEarly) {
    return { isPeak: false, multiplier: 0.9, label: "Light Traffic" };
  }
  return { isPeak: false, multiplier: 1.0, label: "Normal Traffic" };
}

function computeScheduleOutcome(
  route: BusRoute,
  boardingOffsetMins: number,
  tripMins: number,
  departureDate: Date
): { adjustedTripMins: number; schedule: JourneyScheduleInfo } {
  const nowMins = departureDate.getHours() * 60 + departureDate.getMinutes();
  const traffic = getTrafficContext(nowMins);
  const adjustedTripMins = Math.max(5, Math.round(tripMins * traffic.multiplier));

  const firstMins = parseClockMins(route.firstBusTime, 5 * 60 + 30);
  const lastMins = parseClockMins(route.lastBusTime, 22 * 60 + 15);
  const effectiveFreq = Math.max(
    4,
    traffic.isPeak && route.peakFrequencyMins ? route.peakFrequencyMins : route.frequencyMins || 12
  );

  // Offset from route terminal to this boarding stop shifts scheduled pass-through times.
  const firstAtStop = firstMins + boardingOffsetMins;
  const lastAtStop = lastMins + boardingOffsetMins;
  const serviceWindow = `${formatClockFromMins(firstMins)} – ${formatClockFromMins(lastMins)}`;

  let inServiceNow = nowMins >= firstAtStop && nowMins <= lastAtStop;
  let nextDepMins: number;

  if (nowMins < firstAtStop) {
    inServiceNow = false;
    nextDepMins = firstAtStop;
  } else if (nowMins > lastAtStop) {
    inServiceNow = false;
    nextDepMins = firstAtStop + 1440; // Next morning's first bus
  } else {
    const elapsed = nowMins - firstAtStop;
    const cycles = Math.ceil(elapsed / effectiveFreq);
    nextDepMins = firstAtStop + cycles * effectiveFreq;
    if (nextDepMins === nowMins) {
      nextDepMins += 1;
    }
    if (nextDepMins > lastAtStop) {
      inServiceNow = false;
      nextDepMins = firstAtStop + 1440;
    }
  }

  const waitMins = Math.max(1, nextDepMins - nowMins);
  const upcomingDepartures = [0, 1, 2].map((k) =>
    formatClockFromMins(nextDepMins + k * effectiveFreq)
  );

  return {
    adjustedTripMins,
    schedule: {
      inServiceNow,
      waitMins,
      frequencyMins: effectiveFreq,
      departureTimeLabel: formatClockFromMins(nextDepMins),
      arrivalTimeLabel: formatClockFromMins(nextDepMins + adjustedTripMins),
      upcomingDepartures,
      serviceWindow,
      trafficNote: inServiceNow ? traffic.label : "Next Morning Service",
    },
  };
}

function findMatchingStop(query: string, stopsCatalog: BusStop[]): BusStop | undefined {
  const expanded = expandQueryAlias(query);
  const raw = normalizeText(query);
  return stopsCatalog.find(
    (s) =>
      normalizeText(s.name) === expanded ||
      normalizeText(s.code) === raw ||
      normalizeText(s.bengaliName) === raw ||
      normalizeText(s.name).includes(expanded) ||
      normalizeText(s.bengaliName).includes(raw) ||
      (raw.length >= 4 && normalizeText(s.landmark).includes(raw))
  );
}

/**
 * Resolve a free-text query against known Kolkata bus stops or curated landmarks
 * without making any external network request.
 */
export function resolveLocalPlace(query: string, stopsCatalog: BusStop[]): PlacePoint | null {
  const raw = normalizeText(query);
  if (!raw) return null;

  const stop = findMatchingStop(query, stopsCatalog);
  if (stop) {
    return { lat: stop.lat, lng: stop.lng, label: stop.name, source: "catalog" };
  }

  const expanded = expandQueryAlias(query);
  const landmark = KOLKATA_LANDMARKS.find((lm) =>
    lm.keywords.some((kw) => raw === kw || expanded === kw || raw.includes(kw) || kw.includes(raw))
  );
  if (landmark) {
    return { lat: landmark.lat, lng: landmark.lng, label: landmark.label, source: "landmark" };
  }

  return null;
}

interface CorridorProjection {
  pos: number;
  nearestIdx: number;
  distKm: number;
  typicalTimeMins: number;
  fareFromStart: number;
  segmentLabel: string;
}

const MAX_CORRIDOR_DIST_KM = 1.65;

/**
 * Project any (lat, lng) map coordinate onto the consecutive stop segments of a route.
 * Detects intermediate locations that lie between two stops along a bus's corridor.
 */
function projectPointOntoRoute(
  lat: number,
  lng: number,
  route: BusRoute
): CorridorProjection | null {
  const pts = route.stopPoints;
  if (!pts || pts.length < 2) return null;

  // O(1) spatial bounding-box check skips ~85% of distant routes before trig/haversine math.
  const box = getRouteBBox(route);
  if (box && (lat < box.minLat || lat > box.maxLat || lng < box.minLng || lng > box.maxLng)) {
    return null;
  }

  const cosLat = Math.cos(toRad(lat));
  let bestSegIdx = 0;
  let bestT = 0;
  let bestDistKm = Infinity;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const ax = a.lng * cosLat;
    const ay = a.lat;
    const bx = b.lng * cosLat;
    const by = b.lat;
    const px = lng * cosLat;
    const py = lat;

    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq)) : 0;
    const projLat = a.lat + t * (b.lat - a.lat);
    const projLng = a.lng + t * (b.lng - a.lng);
    const distKm = haversineKm(lat, lng, projLat, projLng);

    if (distKm < bestDistKm) {
      bestDistKm = distKm;
      bestSegIdx = i;
      bestT = t;
    }
  }

  if (bestDistKm > MAX_CORRIDOR_DIST_KM) return null;

  const a = pts[bestSegIdx];
  const b = pts[bestSegIdx + 1];
  const nearestIdx = bestT < 0.5 ? bestSegIdx : bestSegIdx + 1;
  const typicalTimeMins = Math.round(a.typicalTimeMins + bestT * (b.typicalTimeMins - a.typicalTimeMins));
  const fareFromStart = Math.round(a.fareFromStart + bestT * (b.fareFromStart - a.fareFromStart));
  const segmentLabel =
    bestT < 0.15
      ? a.name
      : bestT > 0.85
        ? b.name
        : `${a.name} – ${b.name}`;

  return {
    pos: bestSegIdx + bestT,
    nearestIdx,
    distKm: Math.round(bestDistKm * 10) / 10,
    typicalTimeMins,
    fareFromStart,
    segmentLabel,
  };
}

interface RouteEndpoint {
  pos: number;
  stopIdx: number;
  name: string;
  typicalTimeMins?: number;
  fareFromStart?: number;
  viaCorridor: boolean;
  walkKm: number;
}

function resolveStopIndex(
  route: BusRoute,
  expandedQuery: string,
  matchedStopNormalized: string | null
): number {
  if (!expandedQuery) return -1;

  const routeNames = route.stopPoints?.map((p) => p.name) ?? route.stops;
  return routeNames.findIndex((name) => {
    const n = normalizeText(name);
    if (n === expandedQuery || n.includes(expandedQuery) || expandedQuery.includes(n)) return true;
    if (matchedStopNormalized) {
      return (
        n === matchedStopNormalized ||
        n.includes(matchedStopNormalized) ||
        matchedStopNormalized.includes(n)
      );
    }
    return false;
  });
}

function buildLegFromEndpoints(
  route: BusRoute,
  fromEp: RouteEndpoint,
  toEp: RouteEndpoint,
  departureDate: Date,
  liveBuses?: LiveBus[]
): DirectJourney {
  const names = route.stopPoints?.map((p) => p.name) ?? route.stops;
  const direction: "forward" | "return" = fromEp.pos <= toEp.pos ? "forward" : "return";
  const stopsBetween = Math.max(1, Math.round(Math.abs(toEp.pos - fromEp.pos)));
  const totalSegments = Math.max(1, names.length - 1);

  let rawEstMins = Math.max(5, Math.round((Math.abs(toEp.pos - fromEp.pos) / totalSegments) * route.avgTripMins));
  let estFare = route.fareMin;
  let boardingOffsetMins = Math.round((fromEp.pos / totalSegments) * route.avgTripMins);

  const fromTime = fromEp.typicalTimeMins ?? route.stopPoints?.[fromEp.stopIdx]?.typicalTimeMins;
  const toTime = toEp.typicalTimeMins ?? route.stopPoints?.[toEp.stopIdx]?.typicalTimeMins;
  const fromFare = fromEp.fareFromStart ?? route.stopPoints?.[fromEp.stopIdx]?.fareFromStart;
  const toFare = toEp.fareFromStart ?? route.stopPoints?.[toEp.stopIdx]?.fareFromStart;

  if (fromTime != null && toTime != null) {
    const timeDiff = Math.abs(toTime - fromTime);
    if (timeDiff > 0) rawEstMins = timeDiff;
    boardingOffsetMins =
      direction === "forward" ? fromTime : Math.max(0, route.avgTripMins - fromTime);
  }
  if (fromFare != null && toFare != null) {
    const fareDiff = Math.abs(toFare - fromFare);
    estFare = Math.max(route.fareMin, fareDiff || route.fareMin);
  }

  const { adjustedTripMins, schedule } = computeScheduleOutcome(
    route,
    boardingOffsetMins,
    rawEstMins,
    departureDate
  );

  const matchedLive = liveBuses?.find(
    (b) => b.routeId === route.id || b.busNumber.toLowerCase() === route.routeNumber.toLowerCase()
  );

  const maxWalkKm = Math.max(fromEp.walkKm, toEp.walkKm);
  let corridorMatchNote: string | undefined;
  if (fromEp.viaCorridor || toEp.viaCorridor) {
    const parts: string[] = [];
    if (fromEp.viaCorridor) parts.push(`Board near ${fromEp.name} (~${fromEp.walkKm} km)`);
    if (toEp.viaCorridor) parts.push(`Drop near ${toEp.name} (~${toEp.walkKm} km)`);
    corridorMatchNote = parts.join(" · ");
  }

  return {
    route,
    direction,
    fromStopName: fromEp.name,
    toStopName: toEp.name,
    stopsBetween,
    estMins: adjustedTripMins,
    estFare,
    schedule,
    ...(corridorMatchNote && { corridorMatchNote, corridorWalkKm: maxWalkKm }),
    ...(matchedLive && {
      liveMatch: {
        busId: matchedLive.id,
        busNumber: matchedLive.busNumber,
        regNumber: matchedLive.regNumber,
        nextStop: matchedLive.nextStop,
        etaNextStopMins: matchedLive.etaNextStopMins,
        occupancy: matchedLive.occupancy,
        telemetrySource: matchedLive.telemetrySource,
      },
    }),
  };
}

/**
 * Find direct and 1-transfer bus routes between two Kolkata locations,
 * supporting stop names, landmarks, and geometric map-corridor matching
 * for intermediate places that fall between a route's source and destination.
 */
export function findJourneys(
  fromQuery: string,
  toQuery: string,
  routes: BusRoute[],
  stopsCatalog: BusStop[],
  options?: {
    departureTime?: Date;
    liveBuses?: LiveBus[];
    fromCoord?: PlacePoint | null;
    toCoord?: PlacePoint | null;
  }
): JourneySearchResult {
  const departureDate = options?.departureTime ?? new Date();
  const liveBuses = options?.liveBuses;
  const searchTimeLabel = formatClockFromMins(
    departureDate.getHours() * 60 + departureDate.getMinutes()
  );

  const cleanFrom = normalizeText(fromQuery);
  const cleanTo = normalizeText(toQuery);

  if (!cleanFrom || !cleanTo || expandQueryAlias(cleanFrom) === expandQueryAlias(cleanTo)) {
    return {
      resolvedFrom: null,
      resolvedTo: null,
      searchTimeLabel,
      direct: [],
      connecting: [],
    };
  }

  const fromStopMatch = findMatchingStop(fromQuery, stopsCatalog);
  const toStopMatch = findMatchingStop(toQuery, stopsCatalog);
  const fromPlace =
    options?.fromCoord ?? resolveLocalPlace(fromQuery, stopsCatalog);
  const toPlace =
    options?.toCoord ?? resolveLocalPlace(toQuery, stopsCatalog);

  const expandedFrom = expandQueryAlias(fromQuery);
  const expandedTo = expandQueryAlias(toQuery);
  const matchedFromNorm = fromStopMatch ? normalizeText(fromStopMatch.name) : null;
  const matchedToNorm = toStopMatch ? normalizeText(toStopMatch.name) : null;

  const direct: DirectJourney[] = [];
  const startRoutes: Array<{ route: BusRoute; fromEp: RouteEndpoint; names: string[] }> = [];
  const endRoutes: Array<{
    route: BusRoute;
    toEp: RouteEndpoint;
    indexByNormName: Map<string, number>;
  }> = [];

  for (const route of routes) {
    const names = route.stopPoints?.map((p) => p.name) ?? route.stops;
    const fromIdx = resolveStopIndex(route, expandedFrom, matchedFromNorm);
    const toIdx = resolveStopIndex(route, expandedTo, matchedToNorm);

    let fromEp: RouteEndpoint | null = null;
    if (fromIdx >= 0) {
      fromEp = {
        pos: fromIdx,
        stopIdx: fromIdx,
        name: names[fromIdx],
        viaCorridor: false,
        walkKm: 0,
      };
    } else if (fromPlace) {
      const proj = projectPointOntoRoute(fromPlace.lat, fromPlace.lng, route);
      if (proj) {
        fromEp = {
          pos: proj.pos,
          stopIdx: proj.nearestIdx,
          name: proj.segmentLabel,
          typicalTimeMins: proj.typicalTimeMins,
          fareFromStart: proj.fareFromStart,
          viaCorridor: true,
          walkKm: proj.distKm,
        };
      }
    }

    let toEp: RouteEndpoint | null = null;
    if (toIdx >= 0) {
      toEp = {
        pos: toIdx,
        stopIdx: toIdx,
        name: names[toIdx],
        viaCorridor: false,
        walkKm: 0,
      };
    } else if (toPlace) {
      const proj = projectPointOntoRoute(toPlace.lat, toPlace.lng, route);
      if (proj) {
        toEp = {
          pos: proj.pos,
          stopIdx: proj.nearestIdx,
          name: proj.segmentLabel,
          typicalTimeMins: proj.typicalTimeMins,
          fareFromStart: proj.fareFromStart,
          viaCorridor: true,
          walkKm: proj.distKm,
        };
      }
    }

    if (fromEp && toEp && Math.abs(toEp.pos - fromEp.pos) >= 0.15) {
      direct.push(buildLegFromEndpoints(route, fromEp, toEp, departureDate, liveBuses));
    }
    if (fromEp) {
      startRoutes.push({ route, fromEp, names });
    }
    if (toEp) {
      const indexByNormName = new Map<string, number>();
      for (let idx = 0; idx < names.length; idx++) {
        indexByNormName.set(normalizeText(names[idx]), idx);
      }
      endRoutes.push({ route, toEp, indexByNormName });
    }
  }

  direct.sort((a, b) => {
    const aCorridor = a.corridorMatchNote ? 1 : 0;
    const bCorridor = b.corridorMatchNote ? 1 : 0;
    if (aCorridor !== bCorridor) return aCorridor - bCorridor;
    if (a.liveMatch && !b.liveMatch) return -1;
    if (!a.liveMatch && b.liveMatch) return 1;
    return a.estMins + (a.corridorWalkKm ?? 0) * 8 - (b.estMins + (b.corridorWalkKm ?? 0) * 8);
  });

  // Compute 1-transfer connections using O(1) per-stop transfer hub lookup.
  const connecting: ConnectingJourney[] = [];
  const seenPairs = new Set<string>();

  for (const s of startRoutes) {
    const sNames = s.names;
    for (const e of endRoutes) {
      if (s.route.id === e.route.id) continue;

      for (let i = 0; i < sNames.length; i++) {
        if (Math.abs(i - s.fromEp.pos) < 0.25) continue;
        const transferName = sNames[i];
        const j = e.indexByNormName.get(normalizeText(transferName));
        if (j === undefined || Math.abs(j - e.toEp.pos) < 0.25) continue;

        const pairKey = `${s.route.id}:${e.route.id}:${transferName}`;
        if (seenPairs.has(pairKey)) continue;
        seenPairs.add(pairKey);

        const transferStartEp: RouteEndpoint = {
          pos: i,
          stopIdx: i,
          name: transferName,
          viaCorridor: false,
          walkKm: 0,
        };
        const transferEndEp: RouteEndpoint = {
          pos: j,
          stopIdx: j,
          name: e.route.stopPoints?.[j]?.name ?? transferName,
          viaCorridor: false,
          walkKm: 0,
        };

        const firstLeg = buildLegFromEndpoints(
          s.route,
          s.fromEp,
          transferStartEp,
          departureDate,
          liveBuses
        );
        const arrivalAtTransfer = new Date(
          departureDate.getTime() + (firstLeg.schedule.waitMins + firstLeg.estMins + 4) * 60_000
        );
        const secondLeg = buildLegFromEndpoints(
          e.route,
          transferEndEp,
          e.toEp,
          arrivalAtTransfer,
          liveBuses
        );
        const transferWaitMins = 4 + secondLeg.schedule.waitMins;
        const totalMins = firstLeg.estMins + transferWaitMins + secondLeg.estMins;

        connecting.push({
          firstLeg,
          secondLeg,
          transferStop: transferName,
          transferWaitMins,
          totalMins,
          totalFare: firstLeg.estFare + secondLeg.estFare,
          departureTimeLabel: firstLeg.schedule.departureTimeLabel,
          arrivalTimeLabel: secondLeg.schedule.arrivalTimeLabel,
        });
      }
    }
  }

  connecting.sort((a, b) => a.totalMins - b.totalMins);

  return {
    resolvedFrom: fromPlace?.label ?? fromStopMatch?.name ?? fromQuery.trim(),
    resolvedTo: toPlace?.label ?? toStopMatch?.name ?? toQuery.trim(),
    fromSource: fromPlace?.source,
    toSource: toPlace?.source,
    searchTimeLabel,
    direct,
    connecting: connecting.slice(0, 6),
  };
}
