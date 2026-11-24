// Single source of truth for bus status, occupancy, and telemetry source values.
// These match the values stored in Postgres (docker/init.sql).

export const BUS_STATUSES = ["ON_ROUTE", "DELAYED", "CONGESTED", "IDLE", "TERMINATED"] as const;
export type BusStatus = (typeof BUS_STATUSES)[number];

export const OCCUPANCIES = ["EMPTY", "SEATS_AVAILABLE", "STANDING_ONLY", "FULL"] as const;
export type Occupancy = (typeof OCCUPANCIES)[number];

export const TELEMETRY_SOURCES = ["ESP_IOT", "DRIVER_APP", "COMMUTER_CROWD", "SEED"] as const;
export type TelemetrySource = (typeof TELEMETRY_SOURCES)[number];

export const BUS_STATUS_LABELS: Record<BusStatus, string> = {
  ON_ROUTE: "On Time",
  DELAYED: "Delayed",
  CONGESTED: "Congested",
  IDLE: "Idle",
  TERMINATED: "Out of Service",
};

export const OCCUPANCY_LABELS: Record<Occupancy, string> = {
  EMPTY: "Empty",
  SEATS_AVAILABLE: "Seats Free",
  STANDING_ONLY: "Standing",
  FULL: "Full",
};

export const TELEMETRY_SOURCE_LABELS: Record<TelemetrySource, string> = {
  ESP_IOT: "ESP32 IoT",
  DRIVER_APP: "Driver GPS",
  COMMUTER_CROWD: "Rider Crowd",
  SEED: "Sample",
};

/** Narrow an arbitrary DB string to a known BusStatus. */
export function toBusStatus(value: string | null | undefined): BusStatus {
  return (BUS_STATUSES as readonly string[]).includes(value ?? "")
    ? (value as BusStatus)
    : "ON_ROUTE";
}

/** Narrow an arbitrary DB string to a known Occupancy. */
export function toOccupancy(value: string | null | undefined): Occupancy {
  return (OCCUPANCIES as readonly string[]).includes(value ?? "")
    ? (value as Occupancy)
    : "SEATS_AVAILABLE";
}

/** Narrow an arbitrary DB string to a known TelemetrySource. */
export function toTelemetrySource(value: string | null | undefined): TelemetrySource {
  return (TELEMETRY_SOURCES as readonly string[]).includes(value ?? "")
    ? (value as TelemetrySource)
    : "COMMUTER_CROWD";
}
