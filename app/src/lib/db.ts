import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  BusRoute,
  BusStop,
  IoTDeviceInfo,
  KOLKATA_ROUTES,
  KOLKATA_STOPS,
  LiveBus,
  RouteStopPoint,
} from "./data";
import {
  BusStatus,
  Occupancy,
  TelemetrySource,
  toBusStatus,
  toOccupancy,
  toTelemetrySource,
} from "./enums";
import {
  getMemoryIoTDevices,
  getMemoryLiveBuses,
  getMemoryRecentPings,
  ingestMemoryTelemetry,
  TelemetryEventLog,
} from "./liveStore";
import { computeBusProgress } from "./transit";

let prismaInstance: PrismaClient | null = null;
const AUTHORITATIVE_HOLD_MS = 45_000;

export function getPrisma(): PrismaClient | null {
  if (typeof window !== "undefined") return null;
  if (!prismaInstance) {
    try {
      const connectionString =
        process.env.DATABASE_URL ||
        "postgresql://postgres:postgres@localhost:5432/findmybus?schema=public";
      const pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 1200,
      });
      const adapter = new PrismaPg(pool);
      prismaInstance = new PrismaClient({ adapter });
    } catch {
      prismaInstance = null;
    }
  }
  return prismaInstance;
}

export interface LiveBusesResult {
  buses: LiveBus[];
  storageMode: "postgres" | "memory";
}

export async function getLiveBuses(filterRoute?: string): Promise<LiveBus[]> {
  const res = await getLiveBusesWithMeta(filterRoute);
  return res.buses;
}

export async function getLiveBusesWithMeta(filterRoute?: string): Promise<LiveBusesResult> {
  const db = getPrisma();
  if (db) {
    try {
      const dbBuses = await db.bus.findMany({
        where: filterRoute
          ? { busNumber: { equals: filterRoute, mode: "insensitive" } }
          : undefined,
        include: {
          route: {
            include: {
              routeStops: {
                include: { stop: true },
                orderBy: { stopSequence: "asc" },
              },
            },
          },
        },
        orderBy: { lastPing: "desc" },
        take: 30,
      });

      if (dbBuses.length > 0) {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60_000);
        const recentPings = await db.telemetryPing.findMany({
          where: { recordedAt: { gte: fiveMinsAgo }, busId: { not: null } },
          select: { busId: true, contributorId: true, deviceId: true },
        });
        const contributorsByBus = new Map<string, Set<string>>();
        for (const p of recentPings) {
          const busId = p.busId as string;
          const actor = p.deviceId || p.contributorId || "anon";
          let set = contributorsByBus.get(busId);
          if (!set) {
            set = new Set();
            contributorsByBus.set(busId, set);
          }
          set.add(actor);
        }

        const buses: LiveBus[] = dbBuses.map((b) => {
          const stopPoints: RouteStopPoint[] | undefined =
            b.route?.routeStops && b.route.routeStops.length >= 2
              ? b.route.routeStops.map((rs) => ({
                  stopId: rs.stop.id,
                  name: rs.stop.name,
                  bengaliName: rs.stop.bengaliName || undefined,
                  lat: rs.stop.latitude,
                  lng: rs.stop.longitude,
                  sequence: rs.stopSequence,
                  typicalTimeMins: rs.typicalTimeMins,
                  fareFromStart: rs.fareFromStart,
                }))
              : KOLKATA_ROUTES.find((r) => r.routeNumber === b.busNumber)?.stopPoints;

          const lat = b.currentLat ?? 22.5726;
          const lng = b.currentLng ?? 88.3639;
          const speedKmh = b.speedKmh ?? 25.0;
          const fallbackOrigin = b.route?.source || "Origin";
          const fallbackDest = b.route?.destination || "Terminus";

          const progress = computeBusProgress(
            lat,
            lng,
            speedKmh,
            stopPoints,
            fallbackOrigin,
            fallbackDest,
            b.heading
          );

          return {
            id: b.id,
            busNumber: b.busNumber,
            routeId: b.routeId || "route-default",
            regNumber: b.regNumber || "WB-01-XX-0000",
            driverName: b.driverName || undefined,
            currentLat: lat,
            currentLng: lng,
            speedKmh,
            heading: b.heading ?? 0.0,
            status: toBusStatus(b.status),
            occupancy: toOccupancy(b.occupancyStatus),
            telemetrySource: toTelemetrySource(b.telemetrySource),
            activeDeviceId: b.activeDeviceId,
            originStop: progress.originStop,
            nextStop: progress.nextStop,
            etaNextStopMins: progress.etaNextStopMins,
            distanceToNextStopKm: progress.distanceToNextStopKm,
            progressPct: progress.progressPct,
            destination: progress.destination,
            lastUpdatedSecsAgo: Math.max(
              1,
              Math.floor((Date.now() - new Date(b.lastPing).getTime()) / 1000)
            ),
            crowdsourceContributors: Math.max(1, contributorsByBus.get(b.id)?.size ?? 1),
          };
        });

        return { buses, storageMode: "postgres" };
      }
    } catch {
      // Postgres offline or query timed out — fall through to memory store
    }
  }

  return { buses: getMemoryLiveBuses(filterRoute), storageMode: "memory" };
}

function matchesRouteQuery(route: BusRoute, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    route.routeNumber.toLowerCase().includes(q) ||
    route.name.toLowerCase().includes(q) ||
    route.source.toLowerCase().includes(q) ||
    route.destination.toLowerCase().includes(q) ||
    route.stops.some((s) => s.toLowerCase().includes(q))
  );
}

export async function getRoutes(query?: string): Promise<BusRoute[]> {
  const db = getPrisma();
  if (db) {
    try {
      const dbRoutes = await db.route.findMany({
        include: {
          routeStops: {
            include: { stop: true },
            orderBy: { stopSequence: "asc" },
          },
        },
      });

      if (dbRoutes.length > 0) {
        const mapped: BusRoute[] = dbRoutes.map((r) => {
          const fallback = KOLKATA_ROUTES.find((fr) => fr.routeNumber === r.routeNumber);
          const stopPoints: RouteStopPoint[] | undefined =
            r.routeStops.length > 0
              ? r.routeStops.map((rs) => ({
                  stopId: rs.stop.id,
                  name: rs.stop.name,
                  bengaliName: rs.stop.bengaliName || undefined,
                  lat: rs.stop.latitude,
                  lng: rs.stop.longitude,
                  sequence: rs.stopSequence,
                  typicalTimeMins: rs.typicalTimeMins,
                  fareFromStart: rs.fareFromStart,
                }))
              : fallback?.stopPoints;

          const stops = stopPoints?.map((sp) => sp.name) ?? [r.source, r.destination];

          return {
            id: r.id,
            routeNumber: r.routeNumber,
            name: r.name,
            source: r.source,
            destination: r.destination,
            distanceKm: r.distanceKm,
            totalStops: Math.max(r.totalStops, stops.length),
            busType: (r.busType as BusRoute["busType"]) || "ORDINARY",
            operator: (r.operator as BusRoute["operator"]) || "WBTC",
            avgTripMins: r.averageTripTimeMins,
            fareMin: r.fareMin,
            fareMax: r.fareMax,
            frequencyMins: fallback?.frequencyMins ?? 10,
            peakFrequencyMins: fallback?.peakFrequencyMins ?? fallback?.frequencyMins ?? 10,
            firstBusTime: fallback?.firstBusTime ?? "05:30",
            lastBusTime: fallback?.lastBusTime ?? "22:15",
            stops,
            stopPoints,
          };
        });

        const existingNumbers = new Set(mapped.map((r) => r.routeNumber.toLowerCase()));
        const merged = [
          ...mapped,
          ...KOLKATA_ROUTES.filter((fr) => !existingNumbers.has(fr.routeNumber.toLowerCase())),
        ];
        return query ? merged.filter((r) => matchesRouteQuery(r, query)) : merged;
      }
    } catch {
      // Fallback
    }
  }

  return query ? KOLKATA_ROUTES.filter((r) => matchesRouteQuery(r, query)) : KOLKATA_ROUTES;
}

export async function getStops(): Promise<BusStop[]> {
  const db = getPrisma();
  if (db) {
    try {
      const dbStops = await db.stop.findMany({
        include: {
          routeStops: {
            include: { route: { select: { routeNumber: true } } },
          },
        },
        take: 500,
      });
      if (dbStops.length > 0) {
        const mapped: BusStop[] = dbStops.map((s) => ({
          id: s.id,
          name: s.name,
          bengaliName: s.bengaliName || s.name,
          code: s.code || s.name.substring(0, 3).toUpperCase(),
          lat: s.latitude,
          lng: s.longitude,
          landmark: s.landmark || "",
          zone: s.zone || "Kolkata Metropolitan",
          connectingRoutes: Array.from(
            new Set(s.routeStops.map((rs) => rs.route.routeNumber))
          ),
        }));
        const existingIds = new Set(mapped.map((s) => s.id));
        return [
          ...mapped,
          ...KOLKATA_STOPS.filter((fs) => !existingIds.has(fs.id)),
        ];
      }
    } catch {
      // Fallback
    }
  }
  return KOLKATA_STOPS;
}

export interface TelemetryIngestPayload {
  busId?: string;
  busNumber: string;
  regNumber?: string;
  driverName?: string;
  contributorId?: string;
  deviceId?: string;
  source: TelemetrySource;
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  speedKmh?: number | null;
  heading?: number | null;
  satellites?: number | null;
  batteryPct?: number | null;
  signalRssi?: number | null;
  occupancyStatus?: Occupancy;
  status?: BusStatus;
  hardwareType?: string;
  firmwareVersion?: string;
}

export interface TelemetryIngestResponse {
  success: boolean;
  matchedBusId: string | null;
  busNumber: string;
  updatedPosition: boolean;
  source: TelemetrySource;
  storageMode: "postgres" | "memory";
  timestamp: string;
}

/**
 * Unified telemetry ingestion pipeline for ESP32 IoT devices, Driver mobile broadcasts,
 * and Rider crowdsourcing. Writes to PostgreSQL when available and mirrors/falls back
 * to the in-memory live store so updates always work without a running DB.
 */
export async function ingestTelemetry(
  payload: TelemetryIngestPayload
): Promise<TelemetryIngestResponse> {
  // Always update in-memory store so fallback reads stay hot and consistent.
  const memResult = ingestMemoryTelemetry(payload);

  const db = getPrisma();
  if (db) {
    try {
      let bus =
        (payload.busId
          ? await db.bus.findUnique({ where: { id: payload.busId } })
          : null) ??
        (payload.regNumber
          ? await db.bus.findFirst({
              where: { regNumber: { equals: payload.regNumber, mode: "insensitive" } },
            })
          : null) ??
        (await db.bus.findFirst({
          where: { busNumber: { equals: payload.busNumber, mode: "insensitive" } },
          orderBy: { lastPing: "desc" },
        }));

      const route = await db.route.findFirst({
        where: { routeNumber: { equals: payload.busNumber, mode: "insensitive" } },
        select: { id: true, routeNumber: true },
      });

      const now = new Date();
      const isAuthoritative =
        payload.source === "ESP_IOT" || payload.source === "DRIVER_APP";
      const goodFix = (payload.accuracyMeters ?? 0) <= 150;

      // Avoid overwriting a fresh ESP32 or Driver fix with a passive commuter ping.
      const heldByAuthoritative =
        !isAuthoritative &&
        bus != null &&
        (bus.telemetrySource === "ESP_IOT" || bus.telemetrySource === "DRIVER_APP") &&
        now.getTime() - new Date(bus.lastPing).getTime() < AUTHORITATIVE_HOLD_MS;

      if (!bus && isAuthoritative) {
        bus = await db.bus.create({
          data: {
            id: memResult.matchedBusId,
            busNumber: route?.routeNumber || payload.busNumber,
            routeId: route?.id ?? null,
            regNumber: payload.regNumber ?? null,
            driverName: payload.driverName ?? null,
            currentLat: payload.latitude,
            currentLng: payload.longitude,
            speedKmh: payload.speedKmh ?? 0,
            heading: payload.heading ?? 0,
            status: payload.status ?? "ON_ROUTE",
            occupancyStatus: payload.occupancyStatus ?? "SEATS_AVAILABLE",
            telemetrySource: payload.source,
            activeDeviceId: payload.deviceId ?? null,
            lastPing: now,
          },
        });
      }

      const routeId = bus?.routeId ?? route?.id ?? null;
      const shouldMoveBus = Boolean(bus && goodFix && !heldByAuthoritative);

      await db.$transaction([
        db.telemetryPing.create({
          data: {
            busId: bus?.id ?? null,
            routeId,
            contributorId: payload.contributorId ?? null,
            deviceId: payload.deviceId ?? null,
            source: payload.source,
            latitude: payload.latitude,
            longitude: payload.longitude,
            accuracyMeters: payload.accuracyMeters ?? null,
            speedKmh: payload.speedKmh ?? null,
            heading: payload.heading ?? null,
            satellites: payload.satellites ?? null,
            occupancyStatus: payload.occupancyStatus ?? null,
            recordedAt: now,
          },
        }),
        ...(bus && (shouldMoveBus || payload.occupancyStatus || payload.status)
          ? [
              db.bus.update({
                where: { id: bus.id },
                data: {
                  ...(shouldMoveBus && {
                    currentLat: payload.latitude,
                    currentLng: payload.longitude,
                    ...(payload.speedKmh != null && { speedKmh: payload.speedKmh }),
                    ...(payload.heading != null && { heading: payload.heading }),
                    telemetrySource: payload.source,
                    ...(payload.deviceId && { activeDeviceId: payload.deviceId }),
                    lastPing: now,
                  }),
                  ...(payload.occupancyStatus && {
                    occupancyStatus: payload.occupancyStatus,
                  }),
                  ...(payload.status && { status: payload.status }),
                  ...(payload.driverName && { driverName: payload.driverName }),
                },
              }),
            ]
          : []),
        ...(payload.deviceId
          ? [
              db.ioTDevice.upsert({
                where: { id: payload.deviceId },
                update: {
                  busId: bus?.id ?? undefined,
                  busNumber: bus?.busNumber || payload.busNumber,
                  ...(payload.batteryPct != null && { batteryPct: payload.batteryPct }),
                  ...(payload.satellites != null && { satellites: payload.satellites }),
                  ...(payload.signalRssi != null && { signalRssi: payload.signalRssi }),
                  lastLat: payload.latitude,
                  lastLng: payload.longitude,
                  lastSeen: now,
                  isActive: true,
                },
                create: {
                  id: payload.deviceId,
                  busId: bus?.id ?? null,
                  busNumber: bus?.busNumber || payload.busNumber,
                  hardwareType: payload.hardwareType || "ESP32_NEO6M",
                  firmwareVersion: payload.firmwareVersion || "1.2.0",
                  batteryPct: payload.batteryPct ?? null,
                  satellites: payload.satellites ?? null,
                  signalRssi: payload.signalRssi ?? null,
                  lastLat: payload.latitude,
                  lastLng: payload.longitude,
                  lastSeen: now,
                  isActive: true,
                },
              }),
            ]
          : []),
      ]);

      return {
        success: true,
        matchedBusId: bus?.id ?? null,
        busNumber: bus?.busNumber ?? payload.busNumber,
        updatedPosition: shouldMoveBus,
        source: payload.source,
        storageMode: "postgres",
        timestamp: now.toISOString(),
      };
    } catch {
      // Postgres offline — return memory fallback result cleanly
    }
  }

  return {
    success: true,
    matchedBusId: memResult.matchedBusId,
    busNumber: memResult.busNumber,
    updatedPosition: memResult.updatedPosition,
    source: memResult.source,
    storageMode: "memory",
    timestamp: memResult.timestamp,
  };
}

export async function getIoTDevices(): Promise<{
  devices: IoTDeviceInfo[];
  recentPings: TelemetryEventLog[];
  storageMode: "postgres" | "memory";
}> {
  const db = getPrisma();
  if (db) {
    try {
      const [dbDevices, dbPings] = await Promise.all([
        db.ioTDevice.findMany({ orderBy: { lastSeen: "desc" }, take: 50 }),
        db.telemetryPing.findMany({
          include: { bus: { select: { busNumber: true } } },
          orderBy: { recordedAt: "desc" },
          take: 15,
        }),
      ]);

      const now = Date.now();
      const devices: IoTDeviceInfo[] = dbDevices.map((d) => {
        const ageMs = d.lastSeen ? now - new Date(d.lastSeen).getTime() : Infinity;
        const connectionState: IoTDeviceInfo["connectionState"] =
          ageMs <= 90_000 ? "online" : ageMs <= 10 * 60_000 ? "stale" : "offline";
        return {
          id: d.id,
          busId: d.busId,
          busNumber: d.busNumber,
          hardwareType: d.hardwareType,
          firmwareVersion: d.firmwareVersion,
          batteryPct: d.batteryPct,
          satellites: d.satellites,
          signalRssi: d.signalRssi,
          lastLat: d.lastLat,
          lastLng: d.lastLng,
          lastSeenIso: d.lastSeen ? d.lastSeen.toISOString() : null,
          isActive: d.isActive,
          connectionState,
        };
      });

      const recentPings: TelemetryEventLog[] = dbPings.map((p) => ({
        id: p.id.toString(),
        busId: p.busId || "",
        busNumber: p.bus?.busNumber || "N/A",
        source: toTelemetrySource(p.source),
        deviceId: p.deviceId,
        latitude: p.latitude,
        longitude: p.longitude,
        speedKmh: p.speedKmh,
        satellites: p.satellites,
        recordedAtIso: p.recordedAt.toISOString(),
      }));

      return { devices, recentPings, storageMode: "postgres" };
    } catch {
      // Fallback to memory
    }
  }

  return {
    devices: getMemoryIoTDevices(),
    recentPings: getMemoryRecentPings(15),
    storageMode: "memory",
  };
}

export async function getSystemHealth() {
  let postgresConnected = false;
  const db = getPrisma();
  if (db) {
    try {
      await db.$queryRaw`SELECT 1`;
      postgresConnected = true;
    } catch {
      postgresConnected = false;
    }
  }

  const [{ buses, storageMode }, { devices }] = await Promise.all([
    getLiveBusesWithMeta(),
    getIoTDevices(),
  ]);

  return {
    status: "ok",
    postgresConnected,
    storageMode,
    activeBusesCount: buses.length,
    iotDevicesCount: devices.length,
    iotDevicesOnline: devices.filter((d) => d.connectionState === "online").length,
    timestamp: new Date().toISOString(),
  };
}
