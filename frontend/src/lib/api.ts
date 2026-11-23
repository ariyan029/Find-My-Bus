"use client";

import * as React from "react";
import type { BusRoute, BusStop, LiveBus } from "./data";

interface ApiState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetch a list from one of our API routes. Pass `refreshMs` to poll.
 * `key` is the field in the JSON response holding the list (e.g. "buses").
 */
function useApiList<T>(url: string, key: string, refreshMs?: number): ApiState<T> {
  const [state, setState] = React.useState<ApiState<T>>({ data: [], loading: true, error: null });

  React.useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = await res.json();
        setState({ data: (json[key] as T[]) ?? [], loading: false, error: null });
      } catch (err) {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Network error",
        }));
      }
    };

    load();
    const timer = refreshMs ? setInterval(load, refreshMs) : undefined;
    return () => {
      controller.abort();
      if (timer) clearInterval(timer);
    };
  }, [url, key, refreshMs]);

  return state;
}

export function useLiveBuses(refreshMs = 15000) {
  return useApiList<LiveBus>("/api/buses/live", "buses", refreshMs);
}

export function useRoutes() {
  return useApiList<BusRoute>("/api/routes", "routes");
}

export function useStops() {
  return useApiList<BusStop>("/api/stops", "stops");
}
