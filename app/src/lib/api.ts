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

function readCachedList<T>(cacheKey?: string): T[] | null {
  if (!cacheKey || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

function writeCachedList<T>(cacheKey: string | undefined, items: T[]) {
  if (!cacheKey || typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey, JSON.stringify(items));
    localStorage.setItem(`${cacheKey}.updatedAt`, new Date().toISOString());
  } catch {
    // Storage quota exceeded or disabled
  }
}

/**
 * Fetch a list from one of our API routes. Pass `refreshMs` to poll,
 * and optional `cacheKey` to persist an offline fallback copy in localStorage.
 */
function useApiList<T>(
  url: string,
  key: string,
  refreshMs?: number,
  cacheKey?: string
): ApiState<T> {
  const [state, setState] = React.useState<ApiState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  React.useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = await res.json();
        const items = (json[key] as T[]) ?? [];
        writeCachedList(cacheKey, items);
        setState({
          data: items,
          loading: false,
          error: null,
          storageMode: json.storageMode,
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        const cached = readCachedList<T>(cacheKey);
        setState((prev) => ({
          data: cached ?? prev.data,
          loading: false,
          error: err instanceof Error ? err.message : "Network error",
          storageMode: cached ? "cache" : prev.storageMode,
        }));
      }
    };

    load();
    const timer = refreshMs ? setInterval(load, refreshMs) : undefined;
    return () => {
      controller.abort();
      if (timer) clearInterval(timer);
    };
  }, [url, key, refreshMs, cacheKey]);

  return state;
}

export function useLiveBuses(refreshMs = 10000) {
  return useApiList<LiveBus>("/api/buses/live", "buses", refreshMs);
}

export function useRoutes() {
  return useApiList<BusRoute>("/api/routes", "routes", undefined, "pravah.cache.routes");
}

export function useStops() {
  return useApiList<BusStop>("/api/stops", "stops", undefined, "pravah.cache.stops");
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
    const timer = setInterval(() => void load(), refreshMs);
    return () => {
      controller.abort();
      clearInterval(timer);
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
    const timer = setInterval(() => void load(), refreshMs);
    return () => clearInterval(timer);
  }, [refreshMs]);

  return health;
}
