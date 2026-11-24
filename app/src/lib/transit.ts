import type { BusRoute, BusStop, LiveBus, RouteStopPoint } from "./data";
import type { Occupancy, TelemetrySource } from "./enums";

const EARTH_RADIUS_KM = 6371;

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

export interface BusProgressResult {
  originStop: string;
  nextStop: string;
  destination: string;
  distanceToNextStopKm: number;
  etaNextStopMins: number;
  progressPct: number;
}

/**
 * Project a bus's live GPS position onto its ordered corridor stops to derive
 * the next upcoming stop, ETA, distance, and route completion percentage.
 */
export function computeBusProgress(
  lat: number,
  lng: number,
  speedKmh: number,
  stopPoints: RouteStopPoint[] | undefined,
  fallbackOrigin: string,
  fallbackDestination: string
): BusProgressResult {
  if (!stopPoints || stopPoints.length < 2) {
    return {
      originStop: fallbackOrigin,
      nextStop: fallbackDestination,
      destination: fallbackDestination,
      distanceToNextStopKm: 1.5,
      etaNextStopMins: 5,
      progressPct: 50,
    };
  }

  const ordered = [...stopPoints].sort((a, b) => a.sequence - b.sequence);
  const originStop = ordered[0].name;
  const destination = ordered[ordered.length - 1].name;

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

  const nextIdx =
    bestT > 0.92 && bestSegIdx + 2 < ordered.length ? bestSegIdx + 2 : bestSegIdx + 1;
  const nextPoint = ordered[nextIdx];

  const rawDistKm = haversineKm(lat, lng, nextPoint.lat, nextPoint.lng);
  const distanceToNextStopKm = Math.round(rawDistKm * 10) / 10;

  // Use live speed when moving; fall back to realistic urban Kolkata bus speed (22 km/h) when stopped at signals.
  const effectiveSpeedKmh =
    speedKmh >= 8 ? Math.min(55, Math.max(12, speedKmh)) : 22;
  const etaNextStopMins = Math.max(1, Math.round((rawDistKm / effectiveSpeedKmh) * 60));

  const progressPct = Math.max(
    5,
    Math.min(98, Math.round(((bestSegIdx + bestT) / (ordered.length - 1)) * 100))
  );

  return {
    originStop,
    nextStop: nextPoint.name,
    destination,
    distanceToNextStopKm,
    etaNextStopMins,
    progressPct,
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
  searchTimeLabel: string;
  direct: DirectJourney[];
  connecting: ConnectingJourney[];
}

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
      normalizeText(s.bengaliName).includes(raw)
  );
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

function buildLeg(
  route: BusRoute,
  fromIdx: number,
  toIdx: number,
  departureDate: Date,
  liveBuses?: LiveBus[]
): DirectJourney {
  const names = route.stopPoints?.map((p) => p.name) ?? route.stops;
  const direction: "forward" | "return" = fromIdx <= toIdx ? "forward" : "return";
  const stopsBetween = Math.abs(toIdx - fromIdx);
  const totalSegments = Math.max(1, names.length - 1);

  let rawEstMins = Math.max(5, Math.round((stopsBetween / totalSegments) * route.avgTripMins));
  let estFare = route.fareMin;
  let boardingOffsetMins = Math.round((fromIdx / totalSegments) * route.avgTripMins);

  if (route.stopPoints && route.stopPoints.length === names.length) {
    const fromPt = route.stopPoints[fromIdx];
    const toPt = route.stopPoints[toIdx];
    const timeDiff = Math.abs(toPt.typicalTimeMins - fromPt.typicalTimeMins);
    if (timeDiff > 0) rawEstMins = timeDiff;
    const fareDiff = Math.abs(toPt.fareFromStart - fromPt.fareFromStart);
    estFare = Math.max(route.fareMin, fareDiff || route.fareMin);
    boardingOffsetMins =
      direction === "forward"
        ? fromPt.typicalTimeMins
        : Math.max(0, route.avgTripMins - fromPt.typicalTimeMins);
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

  return {
    route,
    direction,
    fromStopName: names[fromIdx],
    toStopName: names[toIdx],
    stopsBetween,
    estMins: adjustedTripMins,
    estFare,
    schedule,
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
 * Find direct and 1-transfer bus routes between two Kolkata stops,
 * complete with schedule windows, departure/arrival times, and fares.
 */
export function findJourneys(
  fromQuery: string,
  toQuery: string,
  routes: BusRoute[],
  stopsCatalog: BusStop[],
  options?: { departureTime?: Date; liveBuses?: LiveBus[] }
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
  const expandedFrom = expandQueryAlias(fromQuery);
  const expandedTo = expandQueryAlias(toQuery);
  const matchedFromNorm = fromStopMatch ? normalizeText(fromStopMatch.name) : null;
  const matchedToNorm = toStopMatch ? normalizeText(toStopMatch.name) : null;

  const direct: DirectJourney[] = [];
  const startRoutes: Array<{ route: BusRoute; fromIdx: number; names: string[] }> = [];
  const endRoutes: Array<{
    route: BusRoute;
    toIdx: number;
    indexByNormName: Map<string, number>;
  }> = [];

  for (const route of routes) {
    const fromIdx = resolveStopIndex(route, expandedFrom, matchedFromNorm);
    const toIdx = resolveStopIndex(route, expandedTo, matchedToNorm);

    if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
      direct.push(buildLeg(route, fromIdx, toIdx, departureDate, liveBuses));
    }
    if (fromIdx >= 0) {
      const names = route.stopPoints?.map((p) => p.name) ?? route.stops;
      startRoutes.push({ route, fromIdx, names });
    }
    if (toIdx >= 0) {
      const names = route.stopPoints?.map((p) => p.name) ?? route.stops;
      const indexByNormName = new Map<string, number>();
      for (let idx = 0; idx < names.length; idx++) {
        indexByNormName.set(normalizeText(names[idx]), idx);
      }
      endRoutes.push({ route, toIdx, indexByNormName });
    }
  }

  direct.sort((a, b) => {
    if (a.liveMatch && !b.liveMatch) return -1;
    if (!a.liveMatch && b.liveMatch) return 1;
    return a.estMins - b.estMins;
  });

  // Compute 1-transfer connections using O(1) per-stop transfer hub lookup.
  const connecting: ConnectingJourney[] = [];
  const seenPairs = new Set<string>();

  for (const s of startRoutes) {
    const sNames = s.names;
    for (const e of endRoutes) {
      if (s.route.id === e.route.id) continue;

      for (let i = 0; i < sNames.length; i++) {
        if (i === s.fromIdx) continue;
        const transferName = sNames[i];
        const j = e.indexByNormName.get(normalizeText(transferName));
        if (j === undefined || j === e.toIdx) continue;

        const pairKey = `${s.route.id}:${e.route.id}:${transferName}`;
        if (seenPairs.has(pairKey)) continue;
        seenPairs.add(pairKey);

        const firstLeg = buildLeg(s.route, s.fromIdx, i, departureDate, liveBuses);
        // Align second leg departure to when the rider arrives at the transfer stop + 4m walk/buffer.
        const arrivalAtTransfer = new Date(
          departureDate.getTime() + (firstLeg.schedule.waitMins + firstLeg.estMins + 4) * 60_000
        );
        const secondLeg = buildLeg(e.route, j, e.toIdx, arrivalAtTransfer, liveBuses);
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
    resolvedFrom: fromStopMatch?.name ?? fromQuery.trim(),
    resolvedTo: toStopMatch?.name ?? toQuery.trim(),
    searchTimeLabel,
    direct,
    connecting: connecting.slice(0, 6),
  };
}
