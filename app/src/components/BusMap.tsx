"use client";

import * as React from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { BusStop, LiveBus } from "@/lib/data";
import { BUS_STATUS_LABELS, OCCUPANCY_LABELS, TELEMETRY_SOURCE_LABELS } from "@/lib/enums";

const KOLKATA_CENTER: L.LatLngTuple = [
  Number(process.env.NEXT_PUBLIC_DEFAULT_LAT) || 22.5726,
  Number(process.env.NEXT_PUBLIC_DEFAULT_LNG) || 88.3639,
];

interface BusMapProps {
  buses: LiveBus[];
  stops: BusStop[];
  selectedBusId?: string;
  onSelectBus?: (busId: string) => void;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const ICON_CACHE = new Map<string, L.DivIcon>();

function getBusIcon(bus: LiveBus, selected: boolean): L.DivIcon {
  const roundedHeading = Math.round(bus.heading / 10) * 10;
  const cacheKey = `${bus.busNumber}|${bus.status}|${selected ? 1 : 0}|${roundedHeading}`;
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

/** Pan to the selected bus only when selection changes or coordinates move noticeably. */
function FollowSelected({ bus }: { bus?: LiveBus }) {
  const map = useMap();
  const lat = bus?.currentLat;
  const lng = bus?.currentLng;
  const id = bus?.id;
  const lastTargetRef = React.useRef<{ id: string; lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    if (id == null || lat == null || lng == null) return;
    const prev = lastTargetRef.current;
    const movedEnough =
      !prev ||
      prev.id !== id ||
      Math.abs(prev.lat - lat) > 0.0002 ||
      Math.abs(prev.lng - lng) > 0.0002;
    if (!movedEnough) return;

    lastTargetRef.current = { id, lat, lng };
    map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { duration: 0.55 });
  }, [map, id, lat, lng]);
  return null;
}

const STOP_PATH_OPTIONS = {
  color: "#4E342E",
  weight: 1.5,
  fillColor: "#F8F4E7",
  fillOpacity: 0.9,
} as const;

const StopsLayer = React.memo(function StopsLayer({ stops }: { stops: BusStop[] }) {
  return (
    <>
      {stops.map((stop) => (
        <CircleMarker key={stop.id} center={[stop.lat, stop.lng]} radius={4} pathOptions={STOP_PATH_OPTIONS}>
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
    name: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
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

export default function BusMap({ buses, stops, selectedBusId, onSelectBus }: BusMapProps) {
  const selected = React.useMemo(
    () => buses.find((b) => b.id === selectedBusId),
    [buses, selectedBusId]
  );
  const [tileProviderIdx, setTileProviderIdx] = React.useState(0);
  const provider = TILE_PROVIDERS[tileProviderIdx];

  return (
    <div className="h-[360px] lg:h-[540px] w-full relative z-0">
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
          maxZoom={19}
          eventHandlers={{
            tileerror: () => {
              setTileProviderIdx((prev) =>
                prev + 1 < TILE_PROVIDERS.length ? prev + 1 : prev
              );
            },
          }}
        />

        <StopsLayer stops={stops} />

        {buses.map((bus) => (
          <BusMarker
            key={bus.id}
            bus={bus}
            selected={bus.id === selectedBusId}
            onSelectBus={onSelectBus}
          />
        ))}

        <FollowSelected bus={selected} />
      </MapContainer>
    </div>
  );
}
