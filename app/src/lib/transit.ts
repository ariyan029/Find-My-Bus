import type { BusRoute, BusStop, RouteStopPoint } from "./data";

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

export interface DirectJourney {
  route: BusRoute;
  direction: "forward" | "return";
  fromStopName: string;
  toStopName: string;
  stopsBetween: number;
  estMins: number;
  estFare: number;
}

export interface ConnectingJourney {
  firstLeg: DirectJourney;
  secondLeg: DirectJourney;
  transferStop: string;
  totalMins: number;
  totalFare: number;
}

export interface JourneySearchResult {
  resolvedFrom: string | null;
  resolvedTo: string | null;
  direct: DirectJourney[];
  connecting: ConnectingJourney[];
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function resolveStopIndex(route: BusRoute, query: string, stopsCatalog: BusStop[]): number {
  const q = normalizeText(query);
  if (!q) return -1;

  // Try matching a known stop first so aliases like "HWH" or "হাওড়া" resolve cleanly.
  const matchedCatalogStop = stopsCatalog.find(
    (s) =>
      normalizeText(s.name) === q ||
      normalizeText(s.code) === q ||
      normalizeText(s.bengaliName) === q ||
      normalizeText(s.name).includes(q)
  );

  const routeNames = route.stopPoints?.map((p) => p.name) ?? route.stops;
  return routeNames.findIndex((name) => {
    const n = normalizeText(name);
    if (n === q || n.includes(q) || q.includes(n)) return true;
    if (matchedCatalogStop) {
      const m = normalizeText(matchedCatalogStop.name);
      return n === m || n.includes(m) || m.includes(n);
    }
    return false;
  });
}

function buildLeg(
  route: BusRoute,
  fromIdx: number,
  toIdx: number
): DirectJourney {
  const names = route.stopPoints?.map((p) => p.name) ?? route.stops;
  const direction: "forward" | "return" = fromIdx <= toIdx ? "forward" : "return";
  const stopsBetween = Math.abs(toIdx - fromIdx);
  const totalSegments = Math.max(1, names.length - 1);

  let estMins = Math.max(5, Math.round((stopsBetween / totalSegments) * route.avgTripMins));
  let estFare = route.fareMin;

  if (route.stopPoints && route.stopPoints.length === names.length) {
    const fromPt = route.stopPoints[fromIdx];
    const toPt = route.stopPoints[toIdx];
    const timeDiff = Math.abs(toPt.typicalTimeMins - fromPt.typicalTimeMins);
    if (timeDiff > 0) estMins = timeDiff;
    const fareDiff = Math.abs(toPt.fareFromStart - fromPt.fareFromStart);
    estFare = Math.max(route.fareMin, fareDiff || route.fareMin);
  }

  return {
    route,
    direction,
    fromStopName: names[fromIdx],
    toStopName: names[toIdx],
    stopsBetween,
    estMins,
    estFare,
  };
}

/**
 * Find direct and 1-transfer bus routes between two Kolkata stops.
 */
export function findJourneys(
  fromQuery: string,
  toQuery: string,
  routes: BusRoute[],
  stopsCatalog: BusStop[]
): JourneySearchResult {
  const cleanFrom = normalizeText(fromQuery);
  const cleanTo = normalizeText(toQuery);

  if (!cleanFrom || !cleanTo || cleanFrom === cleanTo) {
    return { resolvedFrom: null, resolvedTo: null, direct: [], connecting: [] };
  }

  const fromStopMatch = stopsCatalog.find(
    (s) =>
      normalizeText(s.name).includes(cleanFrom) ||
      normalizeText(s.code) === cleanFrom ||
      normalizeText(s.bengaliName).includes(cleanFrom)
  );
  const toStopMatch = stopsCatalog.find(
    (s) =>
      normalizeText(s.name).includes(cleanTo) ||
      normalizeText(s.code) === cleanTo ||
      normalizeText(s.bengaliName).includes(cleanTo)
  );

  const direct: DirectJourney[] = [];
  const startRoutes: Array<{ route: BusRoute; fromIdx: number }> = [];
  const endRoutes: Array<{ route: BusRoute; toIdx: number }> = [];

  for (const route of routes) {
    const fromIdx = resolveStopIndex(route, fromQuery, stopsCatalog);
    const toIdx = resolveStopIndex(route, toQuery, stopsCatalog);

    if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
      direct.push(buildLeg(route, fromIdx, toIdx));
    }
    if (fromIdx >= 0) startRoutes.push({ route, fromIdx });
    if (toIdx >= 0) endRoutes.push({ route, toIdx });
  }

  direct.sort((a, b) => (a.direction === b.direction ? a.estMins - b.estMins : a.direction === "forward" ? -1 : 1));

  // Compute 1-transfer connections when direct options are absent or limited.
  const connecting: ConnectingJourney[] = [];
  const seenPairs = new Set<string>();

  for (const s of startRoutes) {
    const sNames = s.route.stopPoints?.map((p) => p.name) ?? s.route.stops;
    for (const e of endRoutes) {
      if (s.route.id === e.route.id) continue;
      const eNames = e.route.stopPoints?.map((p) => p.name) ?? e.route.stops;

      for (let i = 0; i < sNames.length; i++) {
        if (i === s.fromIdx) continue;
        const transferName = sNames[i];
        const j = eNames.findIndex((n) => normalizeText(n) === normalizeText(transferName));
        if (j < 0 || j === e.toIdx) continue;

        const pairKey = `${s.route.id}:${e.route.id}:${transferName}`;
        if (seenPairs.has(pairKey)) continue;
        seenPairs.add(pairKey);

        const firstLeg = buildLeg(s.route, s.fromIdx, i);
        const secondLeg = buildLeg(e.route, j, e.toIdx);
        connecting.push({
          firstLeg,
          secondLeg,
          transferStop: transferName,
          totalMins: firstLeg.estMins + secondLeg.estMins + 6,
          totalFare: firstLeg.estFare + secondLeg.estFare,
        });
      }
    }
  }

  connecting.sort((a, b) => a.totalMins - b.totalMins);

  return {
    resolvedFrom: fromStopMatch?.name ?? fromQuery.trim(),
    resolvedTo: toStopMatch?.name ?? toQuery.trim(),
    direct,
    connecting: connecting.slice(0, 4),
  };
}
