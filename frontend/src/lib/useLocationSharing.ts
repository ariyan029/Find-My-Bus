"use client";

import * as React from "react";
import type { LiveBus } from "./data";

/** How often we send a fix to the server while sharing. */
const SEND_INTERVAL_MS = 10_000;
/** Stop automatically so a forgotten tab doesn't drain the battery. */
const MAX_SHARE_DURATION_MS = 2 * 60 * 60 * 1000;
const CONTRIBUTOR_KEY = "fmb.contributorId";

export type SharingStatus = "idle" | "locating" | "sharing" | "error";

export interface LocationSharingState {
  status: SharingStatus;
  bus: Pick<LiveBus, "id" | "busNumber" | "regNumber"> | null;
  sentCount: number;
  lastSentAt: number | null;
  accuracyMeters: number | null;
  /** Fatal problem (permission denied, unsupported) — sharing has stopped. */
  error: string | null;
  /** Non-fatal problem (server offline) — still watching GPS, will retry. */
  warning: string | null;
}

const INITIAL: LocationSharingState = {
  status: "idle",
  bus: null,
  sentCount: 0,
  lastSentAt: null,
  accuracyMeters: null,
  error: null,
  warning: null,
};

/** Anonymous, per-device id so the server can rate-limit and dedupe without knowing who you are. */
function getContributorId(): string {
  try {
    let id = localStorage.getItem(CONTRIBUTOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CONTRIBUTOR_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function geoErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location permission was denied. Allow location access for this site to share.";
    case err.POSITION_UNAVAILABLE:
      return "Your location isn't available right now. Check that GPS is on.";
    case err.TIMEOUT:
      return "Timed out getting your location. Try again outdoors or near a window.";
    default:
      return "Couldn't get your location.";
  }
}

export function useLocationSharing() {
  const [state, setState] = React.useState<LocationSharingState>(INITIAL);

  const watchIdRef = React.useRef<number | null>(null);
  const wakeLockRef = React.useRef<WakeLockSentinel | null>(null);
  const lastSendRef = React.useRef(0);
  const inFlightRef = React.useRef(false);
  const stopTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const releaseResources = React.useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  const stop = React.useCallback(() => {
    releaseResources();
    setState(INITIAL);
  }, [releaseResources]);

  const requestWakeLock = React.useCallback(async () => {
    // Mobile browsers pause GPS when the screen sleeps, so keep it on while sharing.
    try {
      if ("wakeLock" in navigator && document.visibilityState === "visible") {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // Not supported or denied — sharing still works while the screen is on.
    }
  }, []);

  const start = React.useCallback(
    (bus: LiveBus) => {
      if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
        setState({ ...INITIAL, status: "error", error: "This browser can't share location." });
        return;
      }

      releaseResources();
      lastSendRef.current = 0;
      const contributorId = getContributorId();
      const busInfo = { id: bus.id, busNumber: bus.busNumber, regNumber: bus.regNumber };
      setState({ ...INITIAL, status: "locating", bus: busInfo });

      const send = async (pos: GeolocationPosition) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        inFlightRef.current = true;
        lastSendRef.current = Date.now();
        try {
          const res = await fetch("/api/crowdsource/ping", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              busId: bus.id,
              busNumber: bus.busNumber,
              contributorId,
              latitude,
              longitude,
              accuracyMeters: accuracy,
              speedKmh: speed != null && !Number.isNaN(speed) ? speed * 3.6 : null,
              heading: heading != null && !Number.isNaN(heading) ? heading : null,
            }),
          });
          if (res.status === 429) return; // We were a bit early; the next fix will go through.
          const json = await res.json().catch(() => ({}));
          if (!res.ok || !json.success) {
            setState((s) => ({
              ...s,
              warning: json.error ?? `Server error (${res.status}). Will keep retrying.`,
            }));
            return;
          }
          setState((s) => ({
            ...s,
            sentCount: s.sentCount + 1,
            lastSentAt: Date.now(),
            warning: null,
          }));
        } catch {
          setState((s) => ({ ...s, warning: "You're offline. Will keep retrying." }));
        } finally {
          inFlightRef.current = false;
        }
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setState((s) => ({ ...s, status: "sharing", accuracyMeters: pos.coords.accuracy, error: null }));
          if (!inFlightRef.current && Date.now() - lastSendRef.current >= SEND_INTERVAL_MS) {
            void send(pos);
          }
        },
        (err) => {
          // Timeouts are transient while watching; only give up on real failures.
          if (err.code === err.TIMEOUT) {
            setState((s) => ({ ...s, warning: geoErrorMessage(err) }));
            return;
          }
          releaseResources();
          setState((s) => ({ ...s, status: "error", error: geoErrorMessage(err) }));
        },
        { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 }
      );

      void requestWakeLock();
      stopTimerRef.current = setTimeout(stop, MAX_SHARE_DURATION_MS);
    },
    [releaseResources, requestWakeLock, stop]
  );

  // The wake lock is dropped whenever the tab is hidden; take it back when we return.
  React.useEffect(() => {
    const onVisible = () => {
      if (watchIdRef.current !== null && document.visibilityState === "visible") {
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [requestWakeLock]);

  // Always stop watching GPS when the component unmounts.
  React.useEffect(() => releaseResources, [releaseResources]);

  return { ...state, start, stop };
}
