import {
  ACTIVE_LIVE_BUSES,
  IoTDeviceInfo,
  KOLKATA_ROUTES,
  LiveBus,
  SEED_IOT_DEVICES,
} from "./data";
import { BusStatus, Occupancy, TelemetrySource } from "./enums";
import { computeBusProgress } from "./transit";

/** Authoritative ESP32 / Driver signals take precedence over passive commuter pings for 45s. */
const AUTHORITATIVE_HOLD_MS = 45_000;
const CONTRIBUTOR_WINDOW_MS = 5 * 60_000;
const STALE_DEVICE_MS = 90_000;

export interface MemoryBusRecord {
  bus: LiveBus;
  lastPingMs: number;
  lastAuthoritativeMs: number;
  contributors: Map<string, number>;
}

export interface TelemetryEventLog {
  id: string;
  busId: string;
  busNumber: string;
  source: TelemetrySource;
  deviceId: string | null;
  latitude: number;
  longitude: number;
  speedKmh: number | null;
  satellites: number | null;
  recordedAtIso: string;
}

interface LiveMemoryState {
  buses: Map<string, MemoryBusRecord>;
  devices: Map<string, IoTDeviceInfo>;
  recentPings: TelemetryEventLog[];
}

const globalForStore = globalThis as unknown as {
  __pravahLiveStore?: LiveMemoryState;
};

function createInitialState(): LiveMemoryState {
  const now = Date.now();
  const buses = new Map<string, MemoryBusRecord>();
  for (const b of ACTIVE_LIVE_BUSES) {
    const route = KOLKATA_ROUTES.find((r) => r.id === b.routeId);
    const progress = computeBusProgress(
      b.currentLat,
      b.currentLng,
      b.speedKmh,
      route?.stopPoints,
      b.originStop,
      b.destination
    );
    buses.set(b.id, {
      bus: { ...b, ...progress },
      lastPingMs: now - b.lastUpdatedSecsAgo * 1000,
      lastAuthoritativeMs:
        b.telemetrySource === "ESP_IOT" || b.telemetrySource === "DRIVER_APP"
          ? now - b.lastUpdatedSecsAgo * 1000
          : 0,
      contributors: new Map(),
    });
  }

  const devices = new Map<string, IoTDeviceInfo>();
  for (const d of SEED_IOT_DEVICES) {
    devices.set(d.id, { ...d });
  }

  return { buses, devices, recentPings: [] };
}

function getStore(): LiveMemoryState {
  if (!globalForStore.__pravahLiveStore) {
    globalForStore.__pravahLiveStore = createInitialState();
  }
  return globalForStore.__pravahLiveStore;
}

export interface MemoryIngestInput {
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

export interface MemoryIngestResult {
  matchedBusId: string;
  busNumber: string;
  updatedPosition: boolean;
  source: TelemetrySource;
  timestamp: string;
}

/**
 * Apply a live GPS ping (from ESP32 IoT, Driver App, or Commuter Crowd)
 * into the in-memory store. Used whenever PostgreSQL is offline or unavailable.
 */
export function ingestMemoryTelemetry(input: MemoryIngestInput): MemoryIngestResult {
  const store = getStore();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  // 1. Resolve matching bus (exact id -> regNumber -> busNumber).
  let record: MemoryBusRecord | undefined;
  if (input.busId) {
    record = store.buses.get(input.busId);
  }
  if (!record && input.regNumber) {
    for (const r of store.buses.values()) {
      if (r.bus.regNumber.toLowerCase() === input.regNumber.toLowerCase()) {
        record = r;
        break;
      }
    }
  }
  if (!record) {
    for (const r of store.buses.values()) {
      if (r.bus.busNumber.toLowerCase() === input.busNumber.toLowerCase()) {
        record = r;
        break;
      }
    }
  }

  // If this bus doesn't exist yet (e.g., new ESP32 unit or driver starting on route 239B), register it.
  if (!record) {
    const route = KOLKATA_ROUTES.find(
      (r) => r.routeNumber.toLowerCase() === input.busNumber.toLowerCase()
    );
    const id =
      input.busId ||
      `bus-${input.busNumber.toLowerCase().replace(/[^a-z0-9]+/g, "")}-${String(store.buses.size + 1).padStart(2, "0")}`;
    const newBus: LiveBus = {
      id,
      busNumber: route?.routeNumber || input.busNumber,
      routeId: route?.id || "route-default",
      regNumber: input.regNumber || `WB-01-LIVE-${store.buses.size + 1}`,
      driverName: input.driverName,
      currentLat: input.latitude,
      currentLng: input.longitude,
      speedKmh: input.speedKmh ?? 0,
      heading: input.heading ?? 0,
      status: input.status ?? "ON_ROUTE",
      occupancy: input.occupancyStatus ?? "SEATS_AVAILABLE",
      telemetrySource: input.source,
      activeDeviceId: input.deviceId ?? null,
      satellites: input.satellites ?? null,
      originStop: route?.source || "Origin",
      nextStop: route?.stops[1] || route?.destination || "Next Stop",
      etaNextStopMins: 4,
      distanceToNextStopKm: 1.0,
      progressPct: 10,
      destination: route?.destination || "Terminus",
      lastUpdatedSecsAgo: 0,
      crowdsourceContributors: 1,
    };
    record = {
      bus: newBus,
      lastPingMs: now,
      lastAuthoritativeMs: 0,
      contributors: new Map(),
    };
    store.buses.set(id, record);
  }

  // 2. Track active contributor / device.
  const contribKey = input.deviceId || input.contributorId || "anon";
  record.contributors.set(contribKey, now);
  for (const [k, ts] of record.contributors) {
    if (now - ts > CONTRIBUTOR_WINDOW_MS) record.contributors.delete(k);
  }

  const isAuthoritative = input.source === "ESP_IOT" || input.source === "DRIVER_APP";
  const goodFix = (input.accuracyMeters ?? 0) <= 150;
  const holdActive =
    !isAuthoritative && now - record.lastAuthoritativeMs < AUTHORITATIVE_HOLD_MS;

  const updatedPosition = goodFix && !holdActive;

  if (updatedPosition) {
    const route = KOLKATA_ROUTES.find(
      (r) =>
        r.id === record!.bus.routeId ||
        r.routeNumber.toLowerCase() === record!.bus.busNumber.toLowerCase()
    );
    const nextSpeed = input.speedKmh ?? record.bus.speedKmh;
    const progress = computeBusProgress(
      input.latitude,
      input.longitude,
      nextSpeed,
      route?.stopPoints,
      record.bus.originStop,
      record.bus.destination
    );

    record.bus = {
      ...record.bus,
      currentLat: input.latitude,
      currentLng: input.longitude,
      speedKmh: nextSpeed,
      heading: input.heading ?? record.bus.heading,
      telemetrySource: input.source,
      activeDeviceId: input.deviceId ?? record.bus.activeDeviceId,
      satellites: input.satellites ?? record.bus.satellites,
      ...progress,
    };
    record.lastPingMs = now;
    if (isAuthoritative) {
      record.lastAuthoritativeMs = now;
    }
  }

  if (input.occupancyStatus) {
    record.bus.occupancy = input.occupancyStatus;
  }
  if (input.status) {
    record.bus.status = input.status;
  }
  if (input.driverName) {
    record.bus.driverName = input.driverName;
  }

  record.bus.crowdsourceContributors = Math.max(
    record.contributors.size,
    record.bus.crowdsourceContributors
  );

  // 3. Upsert IoT device record if telemetry came from ESP hardware.
  if (input.deviceId) {
    const existing = store.devices.get(input.deviceId);
    store.devices.set(input.deviceId, {
      id: input.deviceId,
      busId: record.bus.id,
      busNumber: record.bus.busNumber,
      hardwareType: input.hardwareType || existing?.hardwareType || "ESP32_NEO6M",
      firmwareVersion: input.firmwareVersion || existing?.firmwareVersion || "1.2.0",
      batteryPct: input.batteryPct ?? existing?.batteryPct ?? null,
      satellites: input.satellites ?? existing?.satellites ?? null,
      signalRssi: input.signalRssi ?? existing?.signalRssi ?? null,
      lastLat: input.latitude,
      lastLng: input.longitude,
      lastSeenIso: nowIso,
      isActive: true,
      connectionState: "online",
    });
  }

  store.recentPings.unshift({
    id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
    busId: record.bus.id,
    busNumber: record.bus.busNumber,
    source: input.source,
    deviceId: input.deviceId ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
    speedKmh: input.speedKmh ?? null,
    satellites: input.satellites ?? null,
    recordedAtIso: nowIso,
  });
  if (store.recentPings.length > 50) store.recentPings.length = 50;

  return {
    matchedBusId: record.bus.id,
    busNumber: record.bus.busNumber,
    updatedPosition,
    source: input.source,
    timestamp: nowIso,
  };
}

export function getMemoryLiveBuses(filterRoute?: string): LiveBus[] {
  const store = getStore();
  const now = Date.now();
  const list: LiveBus[] = [];

  for (const record of store.buses.values()) {
    if (
      filterRoute &&
      record.bus.busNumber.toLowerCase() !== filterRoute.toLowerCase()
    ) {
      continue;
    }
    list.push({
      ...record.bus,
      lastUpdatedSecsAgo: Math.max(1, Math.floor((now - record.lastPingMs) / 1000)),
    });
  }

  return list;
}

export function getMemoryIoTDevices(): IoTDeviceInfo[] {
  const store = getStore();
  const now = Date.now();
  return Array.from(store.devices.values()).map((d) => {
    const ageMs = d.lastSeenIso ? now - new Date(d.lastSeenIso).getTime() : Infinity;
    const connectionState: IoTDeviceInfo["connectionState"] =
      ageMs <= STALE_DEVICE_MS ? "online" : ageMs <= 10 * 60_000 ? "stale" : "offline";
    return { ...d, connectionState };
  });
}

export function getMemoryRecentPings(limit = 15): TelemetryEventLog[] {
  return getStore().recentPings.slice(0, limit);
}
