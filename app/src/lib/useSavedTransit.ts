"use client";

import * as React from "react";

const STORAGE_KEY = "pravah.savedTransit.v1";
const STATS_KEY = "pravah.contributionStats.v1";

export interface RecentSearchItem {
  id: string;
  from: string;
  to: string;
  lines: string;
  timestampIso: string;
}

export interface UserPreferences {
  bgTracking: boolean;
  autoOffline: boolean;
}

export interface ContributionStats {
  pingsSent: number;
  kmLogged: number;
}

interface SavedTransitData {
  savedRouteIds: string[];
  savedStopIds: string[];
  recentSearches: RecentSearchItem[];
  preferences: UserPreferences;
}

const DEFAULT_SAVED_DATA: SavedTransitData = {
  savedRouteIds: ["route-s12", "route-ac39", "route-c11"],
  savedStopIds: ["stop-howrah", "stop-esplanade", "stop-sector5", "stop-airport"],
  recentSearches: [
    {
      id: "rs-1",
      from: "Howrah Station",
      to: "Salt Lake Sector V",
      lines: "S-12, C-11",
      timestampIso: new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    },
    {
      id: "rs-2",
      from: "Howrah Station",
      to: "Netaji Subhash Airport (Gate 1)",
      lines: "AC-39",
      timestampIso: new Date(Date.now() - 24 * 60 * 60_000).toISOString(),
    },
    {
      id: "rs-3",
      from: "Jadavpur 8B Bus Stand",
      to: "Salt Lake Karunamoyee",
      lines: "S-9",
      timestampIso: new Date(Date.now() - 48 * 60 * 60_000).toISOString(),
    },
  ],
  preferences: {
    bgTracking: true,
    autoOffline: true,
  },
};

function readSavedData(): SavedTransitData {
  if (typeof window === "undefined") return DEFAULT_SAVED_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SAVED_DATA;
    const parsed = JSON.parse(raw) as Partial<SavedTransitData>;
    return {
      savedRouteIds: Array.isArray(parsed.savedRouteIds)
        ? parsed.savedRouteIds
        : DEFAULT_SAVED_DATA.savedRouteIds,
      savedStopIds: Array.isArray(parsed.savedStopIds)
        ? parsed.savedStopIds
        : DEFAULT_SAVED_DATA.savedStopIds,
      recentSearches: Array.isArray(parsed.recentSearches)
        ? parsed.recentSearches
        : DEFAULT_SAVED_DATA.recentSearches,
      preferences: parsed.preferences ?? DEFAULT_SAVED_DATA.preferences,
    };
  } catch {
    return DEFAULT_SAVED_DATA;
  }
}

function writeSavedData(data: SavedTransitData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage error
  }
}

export function readContributionStats(): ContributionStats {
  if (typeof window === "undefined") return { pingsSent: 0, kmLogged: 0 };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { pingsSent: 0, kmLogged: 0 };
    const parsed = JSON.parse(raw) as Partial<ContributionStats>;
    return {
      pingsSent: typeof parsed.pingsSent === "number" ? parsed.pingsSent : 0,
      kmLogged: typeof parsed.kmLogged === "number" ? parsed.kmLogged : 0,
    };
  } catch {
    return { pingsSent: 0, kmLogged: 0 };
  }
}

export function recordContributionStat(addPings: number, addKm: number) {
  if (typeof window === "undefined") return;
  try {
    const prev = readContributionStats();
    const next: ContributionStats = {
      pingsSent: prev.pingsSent + addPings,
      kmLogged: Math.round((prev.kmLogged + addKm) * 100) / 100,
    };
    localStorage.setItem(STATS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("pravah-saved-updated"));
  } catch {
    // Ignore storage error
  }
}

function subscribeSavedStore(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("pravah-saved-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("pravah-saved-updated", callback);
  };
}

let cachedSavedRaw: string | null = null;
let cachedSavedSnapshot: SavedTransitData = DEFAULT_SAVED_DATA;

function getSavedSnapshot(): SavedTransitData {
  if (typeof window === "undefined") return DEFAULT_SAVED_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedSavedRaw) return cachedSavedSnapshot;
    cachedSavedRaw = raw;
    cachedSavedSnapshot = raw ? readSavedData() : DEFAULT_SAVED_DATA;
    return cachedSavedSnapshot;
  } catch {
    return DEFAULT_SAVED_DATA;
  }
}

let cachedStatsRaw: string | null = null;
let cachedStatsSnapshot: ContributionStats = { pingsSent: 0, kmLogged: 0 };

function getStatsSnapshot(): ContributionStats {
  if (typeof window === "undefined") return cachedStatsSnapshot;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw === cachedStatsRaw) return cachedStatsSnapshot;
    cachedStatsRaw = raw;
    cachedStatsSnapshot = raw ? readContributionStats() : { pingsSent: 0, kmLogged: 0 };
    return cachedStatsSnapshot;
  } catch {
    return cachedStatsSnapshot;
  }
}

const SERVER_SAVED_SNAPSHOT: SavedTransitData = DEFAULT_SAVED_DATA;
const SERVER_STATS_SNAPSHOT: ContributionStats = { pingsSent: 0, kmLogged: 0 };

export function useSavedTransit() {
  const data = React.useSyncExternalStore(
    subscribeSavedStore,
    getSavedSnapshot,
    () => SERVER_SAVED_SNAPSHOT
  );
  const stats = React.useSyncExternalStore(
    subscribeSavedStore,
    getStatsSnapshot,
    () => SERVER_STATS_SNAPSHOT
  );

  const update = React.useCallback((updater: (prev: SavedTransitData) => SavedTransitData) => {
    const prev = readSavedData();
    const next = updater(prev);
    writeSavedData(next);
    cachedSavedRaw = null;
    window.dispatchEvent(new Event("pravah-saved-updated"));
  }, []);

  const toggleSavedRoute = React.useCallback(
    (routeId: string) => {
      update((prev) => ({
        ...prev,
        savedRouteIds: prev.savedRouteIds.includes(routeId)
          ? prev.savedRouteIds.filter((id) => id !== routeId)
          : [routeId, ...prev.savedRouteIds],
      }));
    },
    [update]
  );

  const toggleSavedStop = React.useCallback(
    (stopId: string) => {
      update((prev) => ({
        ...prev,
        savedStopIds: prev.savedStopIds.includes(stopId)
          ? prev.savedStopIds.filter((id) => id !== stopId)
          : [stopId, ...prev.savedStopIds],
      }));
    },
    [update]
  );

  const addRecentSearch = React.useCallback(
    (from: string, to: string, lines: string) => {
      update((prev) => {
        const filtered = prev.recentSearches.filter(
          (item) =>
            !(
              item.from.toLowerCase() === from.toLowerCase() &&
              item.to.toLowerCase() === to.toLowerCase()
            )
        );
        const entry: RecentSearchItem = {
          id: `rs-${Date.now()}`,
          from,
          to,
          lines: lines || "Connecting",
          timestampIso: new Date().toISOString(),
        };
        return {
          ...prev,
          recentSearches: [entry, ...filtered].slice(0, 8),
        };
      });
    },
    [update]
  );

  const clearRecentSearches = React.useCallback(() => {
    update((prev) => ({ ...prev, recentSearches: [] }));
  }, [update]);

  const setPreference = React.useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      update((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, [key]: value },
      }));
    },
    [update]
  );

  return {
    ...data,
    stats,
    hydrated: true,
    toggleSavedRoute,
    toggleSavedStop,
    addRecentSearch,
    clearRecentSearches,
    setPreference,
  };
}
