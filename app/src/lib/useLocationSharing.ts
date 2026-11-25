"use client";

import * as React from "react";
import type { LiveBus } from "./data";
import type { BusStatus, Occupancy } from "./enums";
import { haversineKm } from "./transit";
import { recordContributionStat } from "./useSavedTransit";

/** How often we send a fix to the server while sharing. */
const COMMUTER_SEND_INTERVAL_MS = 10_000;
const DRIVER_SEND_INTERVAL_MS = 5_000;
/** Stop automatically so a forgotten tab doesn't drain the battery. */
const MAX_SHARE_DURATION_MS = 2 * 60 * 60 * 1000;
const CONTRIBUTOR_KEY = "fmb.contributorId";

export type SharingStatus = "idle" | "locating" | "sharing" | "error";

export interface LocationSharingOptions {
  mode?: "commuter" | "driver";
  driverName?: string;
  occupancyStatus?: Occupancy;
  busStatus?: BusStatus;
}

export interface LocationSharingState {
  status: SharingStatus;
  bus: Pick<LiveBus, "id" | "busNumber" | "regNumber"> | null;
  sentCount: number;
  lastSentAt: number | null;
  accuracyMeters: number | null;
  lastCoords: { lat: number; lng: number; speedKmh: number | null; heading: number | null } | null;
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
  lastCoords: null,
  error: null,
  warning: null,
};

/** Anonymous, per-device id so the server can rate-limit and dedupe without knowing who you are. */
export function getContributorId(): string {
  if (typeof window === "undefined") return "server-ssr";
  try {
    let id = localStorage.getItem(CONTRIBUTOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(CONTRIBUTOR_KEY, id);
    }
    return id;
  } catch {
    return "anon-device";
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

export function useLocationSharing(options: LocationSharingOptions = {}) {
  const mode = options.mode ?? "commuter";
  const sendIntervalMs = mode === "driver" ? DRIVER_SEND_INTERVAL_MS : COMMUTER_SEND_INTERVAL_MS;

  const [state, setState] = React.useState<LocationSharingState>(INITIAL);

  const watchIdRef = React.useRef<number | null>(null);
  const wakeLockRef = React.useRef<WakeLockSentinel | null>(null);
  const lastSendRef = React.useRef(0);
  const lastSentPosRef = React.useRef<{ lat: number; lng: number } | null>(null);
  const inFlightRef = React.useRef(false);
  const stopTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestOptionsRef = React.useRef(options);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    latestOptionsRef.current = options;
  });

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
    lastSentPosRef.current = null;
    setState(INITIAL);
  }, [releaseResources]);

  const requestWakeLock = React.useCallback(async () => {
    try {
      const rawPrefs = localStorage.getItem("pravah.savedTransit.v1");
      if (rawPrefs) {
        const parsed = JSON.parse(rawPrefs) as { preferences?: { bgTracking?: boolean } };
        if (parsed.preferences?.bgTracking === false) return;
      }
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
      lastSentPosRef.current = null;
      const contributorId = getContributorId();
      const busInfo = { id: bus.id, busNumber: bus.busNumber, regNumber: bus.regNumber };
      setState({ ...INITIAL, status: "locating", bus: busInfo });

      const send = async (pos: GeolocationPosition) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        const speedKmh =
          speed != null && !Number.isNaN(speed) ? Math.round(speed * 3.6 * 10) / 10 : null;
        const cleanHeading =
          heading != null && !Number.isNaN(heading) ? Math.round(heading) : null;

        inFlightRef.current = true;
        lastSendRef.current = Date.now();
        try {
          const opts = latestOptionsRef.current;
          const isDriver = opts.mode === "driver";
          const endpoint = isDriver ? "/api/driver/broadcast" : "/api/crowdsource/ping";
          const body = isDriver
            ? {
                busId: bus.id,
                busNumber: bus.busNumber,
                regNumber: bus.regNumber,
                driverId: contributorId,
                driverName: opts.driverName || undefined,
                latitude,
                longitude,
                accuracyMeters: accuracy,
                speedKmh,
                heading: cleanHeading,
                occupancyStatus: opts.occupancyStatus,
                status: opts.busStatus,
              }
            : {
                busId: bus.id,
                busNumber: bus.busNumber,
                contributorId,
                latitude,
                longitude,
                accuracyMeters: accuracy,
                speedKmh,
                heading: cleanHeading,
              };

          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!mountedRef.current || res.status === 429) return;
          const json = await res.json().catch(() => ({}));
          if (!mountedRef.current) return;
          if (!res.ok || !json.success) {
            setState((s) => ({
              ...s,
              warning: json.error ?? `Server error (${res.status}). Will keep retrying.`,
            }));
            return;
          }

          let deltaKm = 0;
          if (lastSentPosRef.current) {
            const d = haversineKm(
              lastSentPosRef.current.lat,
              lastSentPosRef.current.lng,
              latitude,
              longitude
            );
            if (d < 5) deltaKm = d;
          }
          lastSentPosRef.current = { lat: latitude, lng: longitude };
          recordContributionStat(1, deltaKm);

          setState((s) => ({
            ...s,
            sentCount: s.sentCount + 1,
            lastSentAt: Date.now(),
            lastCoords: { lat: latitude, lng: longitude, speedKmh, heading: cleanHeading },
            warning: null,
          }));
        } catch {
          if (!mountedRef.current) return;
          setState((s) => ({ ...s, warning: "You're offline. Will keep retrying." }));
        } finally {
          inFlightRef.current = false;
        }
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (!mountedRef.current) return;
          const speedKmh =
            pos.coords.speed != null && !Number.isNaN(pos.coords.speed)
              ? Math.round(pos.coords.speed * 3.6 * 10) / 10
              : null;
          const heading =
            pos.coords.heading != null && !Number.isNaN(pos.coords.heading)
              ? Math.round(pos.coords.heading)
              : null;

          // Avoid redundant React re-renders when stationary GPS jitter is < ~4m.
          setState((s) => {
            const movedEnough =
              s.status !== "sharing" ||
              !s.lastCoords ||
              Math.abs(s.lastCoords.lat - pos.coords.latitude) > 0.00004 ||
              Math.abs(s.lastCoords.lng - pos.coords.longitude) > 0.00004 ||
              Math.abs((s.accuracyMeters ?? 0) - pos.coords.accuracy) >= 5;
            if (!movedEnough) return s;
            return {
              ...s,
              status: "sharing",
              accuracyMeters: pos.coords.accuracy,
              lastCoords: {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                speedKmh,
                heading,
              },
              error: null,
            };
          });

          if (!inFlightRef.current && Date.now() - lastSendRef.current >= sendIntervalMs) {
            void send(pos);
          }
        },
        (err) => {
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
    [releaseResources, requestWakeLock, sendIntervalMs, stop]
  );

  React.useEffect(() => {
    const onVisible = () => {
      if (watchIdRef.current !== null && document.visibilityState === "visible") {
        void requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [requestWakeLock]);

  React.useEffect(() => releaseResources, [releaseResources]);

  return { ...state, start, stop };
}
