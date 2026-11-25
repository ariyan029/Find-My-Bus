"use client";

import * as React from "react";
import L from "leaflet";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { BusRoute, BusStop, LiveBus, RouteStopPoint } from "@/lib/data";
import { BUS_STATUS_LABELS, OCCUPANCY_LABELS, TELEMETRY_SOURCE_LABELS } from "@/lib/enums";

const KOLKATA_CENTER: L.LatLngTuple = [
  Number(process.env.NEXT_PUBLIC_DEFAULT_LAT) || 22.5726,
  Number(process.env.NEXT_PUBLIC_DEFAULT_LNG) || 88.3639,
];

interface PassengerCoords {
  lat: number;
  lng: number;
  accuracyMeters?: number | null;
}

interface BusMapProps {
  buses: LiveBus[];
  stops: BusStop[];
  selectedBusId?: string;
  onSelectBus?: (busId: string) => void;
  activeRoute?: BusRoute | null;
  boardedFromStop?: string | null;
  boardedToStop?: string | null;
  passengerCoords?: PassengerCoords | null;
  fitRouteTrigger?: number;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const ICON_CACHE = new Map<string, L.DivIcon>();

function getBusIcon(bus: LiveBus, selected: boolean): L.DivIcon {
  const roundedHeading = Math.round(bus.heading / 5) * 5;
  const cacheKey = `${bus.busNumber}|${bus.status}|${roundedHeading}|${selected ? 1 : 0}`;
  const cached = ICON_CACHE.get(cacheKey);
  if (cached) return cached;

  const tone =
    bus.status === "DELAYED"
      ? "#CC5500"
      : bus.status === "CONGESTED"
        ? "#B25900"
        : "#4E342E";
  const icon = L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div style="
      transform: translate(-50%, -50%);
      display: inline-flex; align-items: center; gap: 4px;
      padding: 3px 8px; border-radius: 999px; white-space: nowrap;
      font: 700 11px/1.4 ui-sans-serif, system-ui, sans-serif; color: #F8F4E7;
      background: ${tone};
      border: 2px solid ${selected ? "#CC5500" : "rgba(248, 244, 231, 0.7)"};
      box-shadow: 0 2px 8px rgba(78, 52, 46, 0.35)${selected ? `, 0 0 0 4px rgba(204, 85, 0, 0.35)` : ""};
    ">
      <span style="display:inline-block;transform:rotate(${roundedHeading}deg);color:#CC5500">▲</span>${escapeHtml(bus.busNumber)}
    </div>`,
  });

  if (ICON_CACHE.size > 200) ICON_CACHE.clear();
  ICON_CACHE.set(cacheKey, icon);
  return icon;
}

function endpointPinIcon(label: "A" | "B", color: string): L.DivIcon {
  const key = `pin|${label}|${color}`;
  const cached = ICON_CACHE.get(key);
  if (cached) return cached;
  const icon = L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div style="
      transform: translate(-50%, -100%);
      display: inline-flex; align-items: center; justify-content: center;
      width: 24px; height: 24px; border-radius: 999px 999px 999px 0;
      transform-origin: center;
      background: ${color}; color: #FFFFFF;
      border: 2px solid #FFFFFF;
      font: 800 11px/1 ui-sans-serif, system-ui, sans-serif;
      box-shadow: 0 3px 10px rgba(0,0,0,0.35);
    ">${label}</div>`,
  });
  ICON_CACHE.set(key, icon);
  return icon;
}

function sliceRouteStops(
  points: RouteStopPoint[] | undefined,
  fromStop?: string | null,
  toStop?: string | null
): RouteStopPoint[] {
  if (!points || points.length < 2) return [];
  const ordered = [...points].sort((a, b) => a.sequence - b.sequence);
  if (!fromStop && !toStop) return ordered;

  const findIdx = (q?: string | null) => {
    if (!q) return -1;
    const clean = q.trim().toLowerCase();
    return ordered.findIndex(
      (p) => p.name.toLowerCase() === clean || p.name.toLowerCase().includes(clean)
    );
  };

  const fromIdx = findIdx(fromStop);
  const toIdx = findIdx(toStop);
  if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
    return fromIdx < toIdx
      ? ordered.slice(fromIdx, toIdx + 1)
      : ordered.slice(toIdx, fromIdx + 1).reverse();
  }
  if (fromIdx >= 0) return ordered.slice(fromIdx);
  if (toIdx >= 0) return ordered.slice(0, toIdx + 1);
  return ordered;
}

/** Find nearest index in polyline to split completed vs upcoming route path. */
function splitPolylineAtPoint(
  coords: Array<[number, number]>,
  anchor?: { lat: number; lng: number } | null
): { completed: Array<[number, number]>; upcoming: Array<[number, number]> } {
  if (coords.length < 2 || !anchor) {
    return { completed: [], upcoming: coords };
  }

  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const dLat = coords[i][0] - anchor.lat;
    const dLng = coords[i][1] - anchor.lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  if (bestIdx <= 0) {
    return { completed: [], upcoming: coords };
  }
  if (bestIdx >= coords.length - 1) {
    return { completed: coords, upcoming: [] };
  }

  return {
    completed: coords.slice(0, bestIdx + 1),
    upcoming: coords.slice(bestIdx),
  };
}

/** Pan to the selected bus when followEnabled is active; pause auto-follow on manual drag. */
function FollowSelected({
  bus,
  followEnabled,
  onUserDrag,
}: {
  bus?: LiveBus;
  followEnabled: boolean;
  onUserDrag: () => void;
}) {
  const map = useMap();
  const lat = bus?.currentLat;
  const lng = bus?.currentLng;
  const id = bus?.id;
  const lastTargetRef = React.useRef<{ id: string; lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    const handleDragStart = () => onUserDrag();
    map.on("dragstart", handleDragStart);
    return () => {
      map.off("dragstart", handleDragStart);
    };
  }, [map, onUserDrag]);

  React.useEffect(() => {
    if (!followEnabled || id == null || lat == null || lng == null) return;
    const prev = lastTargetRef.current;
    const movedEnough =
      !prev ||
      prev.id !== id ||
      Math.abs(prev.lat - lat) > 0.0002 ||
      Math.abs(prev.lng - lng) > 0.0002;
    if (!movedEnough) return;

    lastTargetRef.current = { id, lat, lng };
    map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { duration: 0.55 });
  }, [map, id, lat, lng, followEnabled]);
  return null;
}

/** Fit map bounds cleanly to show the entire Google-Maps-style route corridor when triggered. */
function FitRouteBounds({
  routeCoords,
  passengerCoords,
  fitKey,
}: {
  routeCoords: Array<[number, number]>;
  passengerCoords?: PassengerCoords | null;
  fitKey: string;
}) {
  const map = useMap();
  const lastFitKeyRef = React.useRef<string>("");

  React.useEffect(() => {
    if (!fitKey || fitKey === lastFitKeyRef.current || routeCoords.length < 2) return;
    lastFitKeyRef.current = fitKey;

    const allPoints: L.LatLngExpression[] = [...routeCoords];
    if (passengerCoords) {
      allPoints.push([passengerCoords.lat, passengerCoords.lng]);
    }
    const bounds = L.latLngBounds(allPoints);
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [42, 42], maxZoom: 14, animate: true });
    }
  }, [map, fitKey, routeCoords, passengerCoords]);

  return null;
}

const STOP_PATH_OPTIONS = {
  color: "#4E342E",
  weight: 1.5,
  fillColor: "#F8F4E7",
  fillOpacity: 0.9,
} as const;

const ROUTE_STOP_PATH_OPTIONS = {
  color: "#2563EB",
  weight: 2.5,
  fillColor: "#FFFFFF",
  fillOpacity: 1,
} as const;

const StopsLayer = React.memo(function StopsLayer({ stops }: { stops: BusStop[] }) {
  return (
    <>
      {stops.map((stop) => (
        <CircleMarker
          key={stop.id}
          center={[stop.lat, stop.lng]}
          radius={4}
          pathOptions={STOP_PATH_OPTIONS}
        >
          <Tooltip direction="top">
            {stop.name}
            {stop.bengaliName && stop.bengaliName !== stop.name ? ` (${stop.bengaliName})` : ""}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
});

const BusMarker = React.memo(function BusMarker({
  bus,
  selected,
  onSelectBus,
}: {
  bus: LiveBus;
  selected: boolean;
  onSelectBus?: (busId: string) => void;
}) {
  return (
    <Marker
      position={[bus.currentLat, bus.currentLng]}
      icon={getBusIcon(bus, selected)}
      zIndexOffset={selected ? 1000 : 0}
      keyboard
      title={`${bus.busNumber} toward ${bus.destination}`}
      eventHandlers={{ click: () => onSelectBus?.(bus.id) }}
    >
      <Tooltip direction="top" offset={[0, -10]}>
        <strong>{bus.busNumber}</strong> → {bus.destination}
        <br />
        Next: {bus.nextStop} ({bus.etaNextStopMins}m)
        <br />
        {BUS_STATUS_LABELS[bus.status]} · {OCCUPANCY_LABELS[bus.occupancy]} ·{" "}
        {TELEMETRY_SOURCE_LABELS[bus.telemetrySource] || "Live"}
      </Tooltip>
    </Marker>
  );
});

const TILE_PROVIDERS = [
  {
    name: "OpenStreetMap Street",
    url: "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    subdomains: "",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    name: "Esri Street",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    subdomains: "",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, OpenStreetMap contributors",
  },
] as const;

export default function BusMap({
  buses,
  stops,
  selectedBusId,
  onSelectBus,
  activeRoute,
  boardedFromStop,
  boardedToStop,
  passengerCoords,
  fitRouteTrigger = 0,
}: BusMapProps) {
  const selected = React.useMemo(
    () => buses.find((b) => b.id === selectedBusId),
    [buses, selectedBusId]
  );
  const [tileProviderIdx, setTileProviderIdx] = React.useState(0);
  const [followState, setFollowState] = React.useState<{
    busId: string | undefined;
    enabled: boolean;
  }>({ busId: selectedBusId, enabled: true });

  // Road-following geometry fetched asynchronously from /api/route-path (OSRM + stop fallback).
  const [roadPathCache, setRoadPathCache] = React.useState<{
    key: string;
    coords: Array<[number, number]>;
    source: "osrm" | "stops";
  } | null>(null);

  const slicedRouteStops = React.useMemo(
    () => sliceRouteStops(activeRoute?.stopPoints, boardedFromStop, boardedToStop),
    [activeRoute, boardedFromStop, boardedToStop]
  );

  const routeRequestKey = React.useMemo(() => {
    if (!activeRoute) return "";
    return `${activeRoute.routeNumber}|${boardedFromStop || ""}|${boardedToStop || ""}`;
  }, [activeRoute, boardedFromStop, boardedToStop]);

  React.useEffect(() => {
    if (!activeRoute || !routeRequestKey) return;
    let active = true;

    const params = new URLSearchParams({ route: activeRoute.routeNumber });
    if (boardedFromStop) params.set("from", boardedFromStop);
    if (boardedToStop) params.set("to", boardedToStop);

    fetch(`/api/route-path?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!active || !json?.success || !Array.isArray(json.coordinates)) return;
        setRoadPathCache({
          key: routeRequestKey,
          coords: json.coordinates as Array<[number, number]>,
          source: json.geometrySource === "osrm" ? "osrm" : "stops",
        });
      })
      .catch(() => {
        // Keep immediate stop-to-stop polyline fallback on offline error
      });

    return () => {
      active = false;
    };
  }, [activeRoute, routeRequestKey, boardedFromStop, boardedToStop]);

  const routeCoordinates = React.useMemo<Array<[number, number]>>(() => {
    if (roadPathCache && roadPathCache.key === routeRequestKey && roadPathCache.coords.length >= 2) {
      return roadPathCache.coords;
    }
    return slicedRouteStops.map((s) => [s.lat, s.lng]);
  }, [roadPathCache, routeRequestKey, slicedRouteStops]);

  // Split path at passenger's live GPS (when riding) or selected bus along the route.
  const splitAnchor = React.useMemo(() => {
    if (passengerCoords) return { lat: passengerCoords.lat, lng: passengerCoords.lng };
    if (
      selected &&
      activeRoute &&
      (selected.routeId === activeRoute.id ||
        selected.busNumber.toLowerCase() === activeRoute.routeNumber.toLowerCase())
    ) {
      return { lat: selected.currentLat, lng: selected.currentLng };
    }
    return null;
  }, [passengerCoords, selected, activeRoute]);

  const { completed: completedPath, upcoming: upcomingPath } = React.useMemo(
    () => splitPolylineAtPoint(routeCoordinates, splitAnchor),
    [routeCoordinates, splitAnchor]
  );

  const followEnabled =
    followState.busId === selectedBusId && fitRouteTrigger === 0 ? followState.enabled : false;
  const shouldFollowBus =
    followState.busId === selectedBusId
      ? followState.enabled
      : fitRouteTrigger === 0;

  const pauseFollow = React.useCallback(() => {
    setFollowState({ busId: selectedBusId, enabled: false });
  }, [selectedBusId]);
  const enableFollow = React.useCallback(() => {
    setFollowState({ busId: selectedBusId, enabled: true });
  }, [selectedBusId]);

  const fitKey =
    fitRouteTrigger > 0 || passengerCoords
      ? `${routeRequestKey}|fit:${fitRouteTrigger}|gps:${passengerCoords ? 1 : 0}`
      : "";

  const provider = TILE_PROVIDERS[tileProviderIdx];
  const originStopPoint = slicedRouteStops[0];
  const destStopPoint =
    slicedRouteStops.length >= 2 ? slicedRouteStops[slicedRouteStops.length - 1] : undefined;

  return (
    <div className="h-[360px] lg:h-[540px] w-full relative z-0">
      {activeRoute && routeCoordinates.length >= 2 && (
        <div className="absolute top-3 left-3 z-[400] max-w-[65%] px-2.5 py-1.5 rounded-lg bg-white/92 backdrop-blur-md border border-[#4E342E]/15 shadow-md text-[11px] font-bold text-[#4E342E] flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] shrink-0" />
          <span className="truncate">
            {activeRoute.routeNumber}: {originStopPoint?.name || activeRoute.source} →{" "}
            {destStopPoint?.name || activeRoute.destination}
          </span>
        </div>
      )}

      {selected && (
        <button
          type="button"
          onClick={() => (shouldFollowBus ? pauseFollow() : enableFollow())}
          className={`absolute top-3 right-3 z-[400] px-2.5 py-1.5 rounded-lg text-[11px] font-bold border shadow-md backdrop-blur-md transition-colors cursor-pointer ${
            shouldFollowBus || followEnabled
              ? "bg-[#4E342E]/90 text-[#F8F4E7] border-white/25 hover:bg-[#4E342E]"
              : "bg-[#CC5500] text-white border-white/40 hover:bg-[#B34700]"
          }`}
        >
          {shouldFollowBus ? `Following ${selected.busNumber}` : `Recenter on ${selected.busNumber}`}
        </button>
      )}

      <MapContainer
        center={KOLKATA_CENTER}
        zoom={12}
        scrollWheelZoom={true}
        preferCanvas={true}
        className="h-full w-full bg-[#F8F4E7]"
        aria-label="Map of live buses and stops"
      >
        <TileLayer
          key={provider.url}
          attribution={provider.attribution}
          url={provider.url}
          subdomains={provider.subdomains}
          maxNativeZoom={18}
          maxZoom={19}
          eventHandlers={{
            tileerror: () => {
              setTileProviderIdx((prev) =>
                prev + 1 < TILE_PROVIDERS.length ? prev + 1 : prev
              );
            },
          }}
        />

        {/* Completed route portion (muted) */}
        {completedPath.length >= 2 && (
          <Polyline
            positions={completedPath}
            pathOptions={{ color: "#7E655D", weight: 5, opacity: 0.55, dashArray: "6 6" }}
          />
        )}

        {/* Active / Remaining Google-Maps-style route path (white casing + vivid blue route line) */}
        {upcomingPath.length >= 2 && (
          <>
            <Polyline
              positions={upcomingPath}
              pathOptions={{ color: "#FFFFFF", weight: 9, opacity: 0.92 }}
            />
            <Polyline
              positions={upcomingPath}
              pathOptions={{ color: "#2563EB", weight: 5, opacity: 0.95 }}
            />
          </>
        )}

        <StopsLayer stops={stops} />

        {/* Highlighted stops along the active route */}
        {slicedRouteStops.map((pt, idx) => (
          <CircleMarker
            key={`${pt.stopId}-${idx}`}
            center={[pt.lat, pt.lng]}
            radius={5}
            pathOptions={ROUTE_STOP_PATH_OPTIONS}
          >
            <Tooltip direction="top">
              <strong>{pt.name}</strong>
              {pt.typicalTimeMins > 0 ? ` · ~${pt.typicalTimeMins}m from start` : ""}
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Origin (A) & Destination (B) markers */}
        {originStopPoint && (
          <Marker
            position={[originStopPoint.lat, originStopPoint.lng]}
            icon={endpointPinIcon("A", "#16A34A")}
            zIndexOffset={600}
          >
            <Tooltip direction="top">Origin: {originStopPoint.name}</Tooltip>
          </Marker>
        )}
        {destStopPoint && (
          <Marker
            position={[destStopPoint.lat, destStopPoint.lng]}
            icon={endpointPinIcon("B", "#CC5500")}
            zIndexOffset={600}
          >
            <Tooltip direction="top">Destination: {destStopPoint.name}</Tooltip>
          </Marker>
        )}

        {/* Passenger Live GPS Blue Dot & Accuracy Ring */}
        {passengerCoords && (
          <>
            {passengerCoords.accuracyMeters != null && passengerCoords.accuracyMeters > 0 && (
              <Circle
                center={[passengerCoords.lat, passengerCoords.lng]}
                radius={Math.min(250, Math.max(20, passengerCoords.accuracyMeters))}
                pathOptions={{
                  color: "#2563EB",
                  weight: 1,
                  fillColor: "#2563EB",
                  fillOpacity: 0.14,
                }}
              />
            )}
            <CircleMarker
              center={[passengerCoords.lat, passengerCoords.lng]}
              radius={8}
              pathOptions={{
                color: "#FFFFFF",
                weight: 3,
                fillColor: "#2563EB",
                fillOpacity: 1,
              }}
            >
              <Tooltip direction="top" permanent>
                You are here (Live GPS)
              </Tooltip>
            </CircleMarker>
          </>
        )}

        {buses.map((bus) => (
          <BusMarker
            key={bus.id}
            bus={bus}
            selected={bus.id === selectedBusId}
            onSelectBus={onSelectBus}
          />
        ))}

        <FollowSelected
          bus={selected}
          followEnabled={shouldFollowBus}
          onUserDrag={pauseFollow}
        />
        <FitRouteBounds
          routeCoords={routeCoordinates}
          passengerCoords={passengerCoords}
          fitKey={fitKey}
        />
      </MapContainer>
    </div>
  );
}
