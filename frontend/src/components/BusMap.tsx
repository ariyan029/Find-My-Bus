"use client";

import * as React from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { BusStop, LiveBus } from "@/lib/data";
import { BUS_STATUS_LABELS, OCCUPANCY_LABELS } from "@/lib/enums";

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

function busIcon(bus: LiveBus, selected: boolean): L.DivIcon {
  const tone =
    bus.status === "DELAYED"
      ? "#CC5500"
      : bus.status === "CONGESTED"
        ? "#B25900"
        : "#4E342E";
  return L.divIcon({
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
      <span style="display:inline-block;transform:rotate(${bus.heading}deg);color:#CC5500">▲</span>${escapeHtml(bus.busNumber)}
    </div>`,
  });
}

/** Pan to the selected bus whenever the selection changes. */
function FollowSelected({ bus }: { bus?: LiveBus }) {
  const map = useMap();
  const lat = bus?.currentLat;
  const lng = bus?.currentLng;
  React.useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { duration: 0.6 });
    }
  }, [map, lat, lng]);
  return null;
}

export default function BusMap({ buses, stops, selectedBusId, onSelectBus }: BusMapProps) {
  const selected = buses.find((b) => b.id === selectedBusId);

  return (
    <div className="h-56 rounded-2xl overflow-hidden border border-[#4E342E]/16 shadow-sm relative z-0">
      <MapContainer
        center={KOLKATA_CENTER}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full bg-[#F8F4E7]"
        aria-label="Map of live buses and stops"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {stops.map((stop) => (
          <CircleMarker
            key={stop.id}
            center={[stop.lat, stop.lng]}
            radius={4}
            pathOptions={{ color: "#4E342E", weight: 1.5, fillColor: "#F8F4E7", fillOpacity: 0.9 }}
          >
            <Tooltip direction="top">
              {stop.name}
              {stop.bengaliName && stop.bengaliName !== stop.name ? ` (${stop.bengaliName})` : ""}
            </Tooltip>
          </CircleMarker>
        ))}

        {buses.map((bus) => (
          <Marker
            key={bus.id}
            position={[bus.currentLat, bus.currentLng]}
            icon={busIcon(bus, bus.id === selectedBusId)}
            zIndexOffset={bus.id === selectedBusId ? 1000 : 0}
            keyboard
            title={`${bus.busNumber} toward ${bus.destination}`}
            eventHandlers={{ click: () => onSelectBus?.(bus.id) }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              {bus.busNumber} → {bus.destination}
              <br />
              {BUS_STATUS_LABELS[bus.status]} · {OCCUPANCY_LABELS[bus.occupancy]}
            </Tooltip>
          </Marker>
        ))}

        <FollowSelected bus={selected} />
      </MapContainer>
    </div>
  );
}
