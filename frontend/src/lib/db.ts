import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { KOLKATA_ROUTES, KOLKATA_STOPS, ACTIVE_LIVE_BUSES, BusRoute, BusStop, LiveBus } from "./data";
import { toBusStatus, toOccupancy } from "./enums";

let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient | null {
  if (typeof window !== "undefined") return null;
  if (!prismaInstance) {
    try {
      const connectionString =
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/findmybus?schema=public";
      const pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 1500,
      });
      const adapter = new PrismaPg(pool);
      prismaInstance = new PrismaClient({ adapter });
    } catch {
      prismaInstance = null;
    }
  }
  return prismaInstance;
}

/**
 * Resilient data-fetching helper:
 * Queries the PostgreSQL database when Docker container is active,
 * with instantaneous zero-downtime fallback to enriched Kolkata transit data.
 */
export async function getLiveBuses(filterRoute?: string): Promise<LiveBus[]> {
  const db = getPrisma();
  if (db) {
    try {
      const dbBuses = await db.bus.findMany({
        where: filterRoute ? { busNumber: filterRoute } : undefined,
        include: { route: true },
        take: 20,
      });

      if (dbBuses.length > 0) {
        return dbBuses.map((b) => ({
          id: b.id,
          busNumber: b.busNumber,
          routeId: b.routeId || "route-default",
          regNumber: b.regNumber || "WB-01-XX-0000",
          currentLat: b.currentLat || 22.5726,
          currentLng: b.currentLng || 88.3639,
          speedKmh: b.speedKmh || 30.0,
          heading: b.heading || 0.0,
          status: toBusStatus(b.status),
          occupancy: toOccupancy(b.occupancyStatus),
          nextStop: "Next Scheduled Stop",
          etaNextStopMins: 5,
          destination: b.route?.destination || "Terminus",
          lastUpdatedSecsAgo: Math.max(
            1,
            Math.floor((Date.now() - new Date(b.lastPing).getTime()) / 1000)
          ),
          crowdsourceContributors: 4,
        }));
      }
    } catch {
      // Container offline or query timed out
    }
  }

  // Graceful fallback to rich local Kolkata transit store
  let buses = ACTIVE_LIVE_BUSES;
  if (filterRoute) {
    buses = buses.filter((b) => b.busNumber.toLowerCase() === filterRoute.toLowerCase());
  }
  return buses;
}

export async function getRoutes(query?: string): Promise<BusRoute[]> {
  const db = getPrisma();
  if (db) {
    try {
      const dbRoutes = await db.route.findMany({
        where: query
          ? {
              OR: [
                { routeNumber: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
                { source: { contains: query, mode: "insensitive" } },
                { destination: { contains: query, mode: "insensitive" } },
              ],
            }
          : undefined,
      });

      if (dbRoutes.length > 0) {
        return dbRoutes.map((r) => ({
          id: r.id,
          routeNumber: r.routeNumber,
          name: r.name,
          source: r.source,
          destination: r.destination,
          distanceKm: r.distanceKm,
          totalStops: r.totalStops,
          busType: (r.busType as BusRoute["busType"]) || "ORDINARY",
          operator: (r.operator as BusRoute["operator"]) || "WBTC",
          avgTripMins: r.averageTripTimeMins,
          fareMin: r.fareMin,
          fareMax: r.fareMax,
          frequencyMins: 10,
          stops: [r.source, r.destination],
        }));
      }
    } catch {
      // Fallback
    }
  }

  let routes = KOLKATA_ROUTES;
  if (query) {
    const q = query.toLowerCase();
    routes = routes.filter(
      (r) =>
        r.routeNumber.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.source.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q)
    );
  }
  return routes;
}

export async function getStops(): Promise<BusStop[]> {
  const db = getPrisma();
  if (db) {
    try {
      const dbStops = await db.stop.findMany({ take: 50 });
      if (dbStops.length > 0) {
        return dbStops.map((s) => ({
          id: s.id,
          name: s.name,
          bengaliName: s.bengaliName || s.name,
          code: s.code || s.name.substring(0, 3).toUpperCase(),
          lat: s.latitude,
          lng: s.longitude,
          landmark: s.landmark || "",
          zone: s.zone || "Kolkata Metropolitan",
          connectingRoutes: [],
        }));
      }
    } catch {
      // Fallback
    }
  }
  return KOLKATA_STOPS;
}
