"use client";

import * as React from "react";
import type { BusRoute, BusStop, IoTDeviceInfo, LiveBus } from "./data";
import type { TelemetryEventLog } from "./liveStore";

interface ApiState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  storageMode?: "postgres" | "memory" | "cache";
}

interface CacheEntry<T> {
  data: T[];
  storageMode?: "postgres" | "memory" | "cache";
  fetchedAt: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry<unknown>>();
const IN_FLIGHT = new Map<string, Promise<CacheEntry<unknown>>>();
const LOCAL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function isAutoOfflineEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem("pravah.savedTransit.v1");
    if (!raw) return true;
    const parsed = JSON.parse(raw) as { preferences?: { autoOffline?: boolean } };
    return parsed.preferences?.autoOffline ?? true;
  } catch {
    return true;
  }
}

function readCachedList<T>(cacheKey?: string): T[] | null {
  if (!cacheKey || typeof window === "undefined" || !isAutoOfflineEnabled()) return null;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const updatedAt = localStorage.getItem(`${cacheKey}.updatedAt`);
    if (updatedAt) {
      const age = Date.now() - new Date(updatedAt).getTime();
      if (Number.isFinite(age) && age > LOCAL_CACHE_TTL_MS) return null;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

function writeCachedList<T>(cacheKey: string | undefined, items: T[]) {
  if (!cacheKey || typeof window === "undefined" || !isAutoOfflineEnabled()) return;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(items));
    localStorage.setItem(`${cacheKey}.updatedAt`, new Date().toISOString());
  } catch {
    // Storage quota exceeded or disabled
  }
}

async function fetchDeduplicated<T>(
  url: string,
  key: string,
  noStore: boolean,
  cacheKey?: string
): Promise<CacheEntry<T>> {
  const existing = IN_FLIGHT.get(url);
  if (existing) {
    return (await existing) as CacheEntry<T>;
  }

  const reqPromise = (async (): Promise<CacheEntry<unknown>> => {
    const res = await fetch(url, noStore ? { cache: "no-store" } : undefined);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const json = await res.json();
    const items = (json[key] as unknown[]) ?? [];
    writeCachedList(cacheKey, items);
    const entry: CacheEntry<unknown> = {
      data: items,
      storageMode: json.storageMode,
      fetchedAt: Date.now(),
    };
    MEMORY_CACHE.set(url, entry);
    return entry;
  })();

  IN_FLIGHT.set(url, reqPromise);
  try {
    return (await reqPromise) as CacheEntry<T>;
  } finally {
    IN_FLIGHT.delete(url);
  }
}

/**
 * Fetch a list from one of our API routes with SWR in-memory caching,
 * request deduplication, visibility-aware polling, and localStorage fallback.
 */
function useApiList<T>(
  url: string,
  key: string,
  refreshMs?: number,
  cacheKey?: string,
  staleTimeMs = 60_000
): ApiState<T> {
  const [state, setState] = React.useState<ApiState<T>>(() => {
    const mem = MEMORY_CACHE.get(url) as CacheEntry<T> | undefined;
    if (mem) {
      return {
        data: mem.data,
        loading: false,
        error: null,
        storageMode: mem.storageMode,
      };
    }
    return {
      data: [],
      loading: true,
      error: null,
    };
  });

  React.useEffect(() => {
    let active = true;

    const mem = MEMORY_CACHE.get(url) as CacheEntry<T> | undefined;
    const isFresh = Boolean(mem && !refreshMs && Date.now() - mem.fetchedAt < staleTimeMs);

    const load = async () => {
      try {
        const entry = await fetchDeduplicated<T>(url, key, Boolean(refreshMs), cacheKey);
        if (!active) return;
        setState({
          data: entry.data,
          loading: false,
          error: null,
          storageMode: entry.storageMode,
        });
      } catch (err) {
        if (!active) return;
        const cached = readCachedList<T>(cacheKey);
        setState((prev) => ({
          data: cached ?? prev.data,
          loading: false,
          error: err instanceof Error ? err.message : "Network error",
          storageMode: cached ? "cache" : prev.storageMode,
        }));
      }
    };

    if (!isFresh) {
      void load();
    }

    if (!refreshMs) {
      return () => {
        active = false;
      };
    }

    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      void load();
    }, refreshMs);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void load();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [url, key, refreshMs, cacheKey, staleTimeMs]);

  return state;
}

export function useLiveBuses(refreshMs = 10000) {
  return useApiList<LiveBus>("/api/buses/live", "buses", refreshMs, undefined, 0);
}

export function useRoutes() {
  return useApiList<BusRoute>("/api/routes", "routes", undefined, "pravah.cache.v2.routes", 300_000);
}

export function useStops() {
  return useApiList<BusStop>("/api/stops", "stops", undefined, "pravah.cache.v2.stops", 300_000);
}

export interface IoTTelemetryFeed {
  devices: IoTDeviceInfo[];
  recentPings: TelemetryEventLog[];
  storageMode: "postgres" | "memory";
  loading: boolean;
  refresh: () => void;
}

export function useIoTDevices(refreshMs = 5000): IoTTelemetryFeed {
  const [devices, setDevices] = React.useState<IoTDeviceInfo[]>([]);
  const [recentPings, setRecentPings] = React.useState<TelemetryEventLog[]>([]);
  const [storageMode, setStorageMode] = React.useState<"postgres" | "memory">("memory");
  const [loading, setLoading] = React.useState(true);
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch("/api/iot/telemetry", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        setDevices(json.devices ?? []);
        setRecentPings(json.recentPings ?? []);
        if (json.storageMode) setStorageMode(json.storageMode);
      } catch {
        // Ignore transient offline error
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void load();
    }, refreshMs);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      controller.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshMs, tick]);

  const refresh = React.useCallback(() => setTick((t) => t + 1), []);
  return { devices, recentPings, storageMode, loading, refresh };
}

export interface SystemHealth {
  status: string;
  postgresConnected: boolean;
  storageMode: "postgres" | "memory";
  activeBusesCount: number;
  iotDevicesCount: number;
  iotDevicesOnline: number;
  timestamp: string;
}

export function useSystemHealth(refreshMs = 15000) {
  const [health, setHealth] = React.useState<SystemHealth | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as SystemHealth;
        setHealth(json);
      } catch {
        // Ignore offline error
      }
    };
    void load();
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void load();
    }, refreshMs);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshMs]);

  return health;
}
