import { NextRequest, NextResponse } from "next/server";
import type { RouteStopPoint } from "@/lib/data";
import { getRoutes } from "@/lib/db";

interface CachedRoutePath {
  coordinates: Array<[number, number]>;
  geometrySource: "osrm" | "stops";
  distanceKm?: number;
  durationMins?: number;
  stops: RouteStopPoint[];
}

const ROUTE_PATH_CACHE = new Map<string, CachedRoutePath>();

function sliceStopPoints(
  points: RouteStopPoint[],
  fromQuery?: string,
  toQuery?: string
): RouteStopPoint[] {
  const ordered = [...points].sort((a, b) => a.sequence - b.sequence);
  if (!fromQuery && !toQuery) return ordered;

  const findIdx = (q?: string) => {
    if (!q) return -1;
    const clean = q.trim().toLowerCase();
    return ordered.findIndex(
      (p) => p.name.toLowerCase() === clean || p.name.toLowerCase().includes(clean)
    );
  };

  const fromIdx = findIdx(fromQuery);
  const toIdx = findIdx(toQuery);

  if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
    if (fromIdx < toIdx) {
      return ordered.slice(fromIdx, toIdx + 1);
    }
    return ordered.slice(toIdx, fromIdx + 1).reverse();
  }
  if (fromIdx >= 0) {
    return ordered.slice(fromIdx);
  }
  if (toIdx >= 0) {
    return ordered.slice(0, toIdx + 1);
  }
  return ordered;
}

function sampleWaypoints(points: RouteStopPoint[], maxWaypoints = 25): RouteStopPoint[] {
  if (points.length <= maxWaypoints) return points;
  const result: RouteStopPoint[] = [points[0]];
  const step = (points.length - 1) / (maxWaypoints - 1);
  for (let i = 1; i < maxWaypoints - 1; i++) {
    result.push(points[Math.round(i * step)]);
  }
  result.push(points[points.length - 1]);
  return result;
}

export async function GET(request: NextRequest) {
  const routeNumber = request.nextUrl.searchParams.get("route")?.trim();
  const fromQuery = request.nextUrl.searchParams.get("from")?.trim() || undefined;
  const toQuery = request.nextUrl.searchParams.get("to")?.trim() || undefined;

  if (!routeNumber) {
    return NextResponse.json(
      { success: false, error: "route query parameter is required" },
      { status: 400 }
    );
  }

  const cacheKey = `${routeNumber.toLowerCase()}|${(fromQuery || "").toLowerCase()}|${(toQuery || "").toLowerCase()}`;
  const cached = ROUTE_PATH_CACHE.get(cacheKey);
  if (cached) {
    return NextResponse.json(
      { success: true, routeNumber, ...cached },
      { headers: { "Cache-Control": "public, max-age=3600" } }
    );
  }

  const routes = await getRoutes();
  const route = routes.find(
    (r) => r.routeNumber.toLowerCase() === routeNumber.toLowerCase()
  );
  if (!route || !route.stopPoints || route.stopPoints.length < 2) {
    return NextResponse.json(
      { success: false, error: "Route geometry unavailable" },
      { status: 404 }
    );
  }

  const slicedStops = sliceStopPoints(route.stopPoints, fromQuery, toQuery);
  const stopCoords: Array<[number, number]> = slicedStops.map((s) => [s.lat, s.lng]);

  try {
    const waypoints = sampleWaypoints(slicedStops, 25);
    const coordStr = waypoints.map((w) => `${w.lng},${w.lat}`).join(";");
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;

    const res = await fetch(osrmUrl, {
      headers: {
        "User-Agent": "PRAVAH-Kolkata-Transit/1.0",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const json = (await res.json()) as {
        code?: string;
        routes?: Array<{
          distance?: number;
          duration?: number;
          geometry?: { coordinates?: Array<[number, number]> };
        }>;
      };
      const osrmRoute = json.routes?.[0];
      const rawCoords = osrmRoute?.geometry?.coordinates;
      if (json.code === "Ok" && rawCoords && rawCoords.length >= 2) {
        // OSRM returns [lng, lat]; Leaflet expects [lat, lng].
        const coordinates: Array<[number, number]> = rawCoords.map(([lng, lat]) => [lat, lng]);
        const payload: CachedRoutePath = {
          coordinates,
          geometrySource: "osrm",
          distanceKm:
            osrmRoute.distance != null
              ? Math.round((osrmRoute.distance / 1000) * 10) / 10
              : undefined,
          durationMins:
            osrmRoute.duration != null
              ? Math.max(1, Math.round(osrmRoute.duration / 60))
              : undefined,
          stops: slicedStops,
        };
        if (ROUTE_PATH_CACHE.size > 300) ROUTE_PATH_CACHE.clear();
        ROUTE_PATH_CACHE.set(cacheKey, payload);
        return NextResponse.json(
          { success: true, routeNumber: route.routeNumber, ...payload },
          { headers: { "Cache-Control": "public, max-age=86400" } }
        );
      }
    }
  } catch {
    // OSRM unreachable or timed out — fall back to direct stop-to-stop polyline
  }

  const fallbackPayload: CachedRoutePath = {
    coordinates: stopCoords,
    geometrySource: "stops",
    stops: slicedStops,
  };
  return NextResponse.json({
    success: true,
    routeNumber: route.routeNumber,
    ...fallbackPayload,
  });
}
