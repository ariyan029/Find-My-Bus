import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getIoTDevices, getPrisma, ingestTelemetry } from "@/lib/db";
import { BUS_STATUSES, OCCUPANCIES } from "@/lib/enums";
import { rateLimit } from "@/lib/rateLimit";

const IOT_PING_INTERVAL_MS = 2_000;

/**
 * ESP32 / ESP8266 payload schema. Supports both verbose field names and compact
 * microcontroller aliases (lat/lng, speed/course, sats, batt, rssi, bus).
 */
const IoTPayloadSchema = z
  .object({
    deviceId: z.string().trim().min(3).max(64),
    apiKey: z.string().trim().max(128).optional(),
    busId: z.string().trim().min(1).max(64).optional(),
    busNumber: z.string().trim().min(1).max(32).optional(),
    bus: z.string().trim().min(1).max(32).optional(),
    regNumber: z.string().trim().min(1).max(32).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    lat: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    lng: z.number().min(-180).max(180).optional(),
    lon: z.number().min(-180).max(180).optional(),
    accuracyMeters: z.number().min(0).max(10_000).optional(),
    hdop: z.number().min(0).max(100).optional(),
    speedKmh: z.number().min(0).max(200).nullish(),
    speed: z.number().min(0).max(200).nullish(),
    heading: z.number().min(0).max(360).nullish(),
    course: z.number().min(0).max(360).nullish(),
    satellites: z.number().int().min(0).max(64).nullish(),
    sats: z.number().int().min(0).max(64).nullish(),
    batteryPct: z.number().int().min(0).max(100).nullish(),
    batt: z.number().int().min(0).max(100).nullish(),
    signalRssi: z.number().int().min(-150).max(0).nullish(),
    rssi: z.number().int().min(-150).max(0).nullish(),
    hardwareType: z.string().trim().max(64).optional(),
    firmwareVersion: z.string().trim().max(32).optional(),
    occupancyStatus: z.enum(OCCUPANCIES).optional(),
    status: z.enum(BUS_STATUSES).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.latitude == null && val.lat == null) {
      ctx.addIssue({ code: "custom", path: ["latitude"], message: "latitude or lat is required" });
    }
    if (val.longitude == null && val.lng == null && val.lon == null) {
      ctx.addIssue({
        code: "custom",
        path: ["longitude"],
        message: "longitude, lng, or lon is required",
      });
    }
    if (!val.busNumber && !val.bus && !val.busId) {
      ctx.addIssue({
        code: "custom",
        path: ["busNumber"],
        message: "busNumber, bus, or busId is required",
      });
    }
  });

export async function GET() {
  const data = await getIoTDevices();
  return NextResponse.json({ success: true, ...data });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Body must be valid JSON" }, { status: 400 });
  }

  const parsed = IoTPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid ESP32 telemetry payload",
        issues: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const providedKey = request.headers.get("x-device-key") || d.apiKey;
  const expectedGlobalKey = process.env.IOT_API_KEY;
  if (expectedGlobalKey && providedKey !== expectedGlobalKey) {
    return NextResponse.json(
      { success: false, error: "Unauthorized IoT device key" },
      { status: 401 }
    );
  }

  // Also enforce per-device API key if configured on the IoTDevice row in PostgreSQL.
  const db = getPrisma();
  if (db) {
    try {
      const existingDevice = await db.ioTDevice.findUnique({
        where: { id: d.deviceId },
        select: { apiKey: true, isActive: true },
      });
      if (existingDevice && !existingDevice.isActive) {
        return NextResponse.json(
          { success: false, error: "IoT device is deactivated" },
          { status: 403 }
        );
      }
      if (existingDevice?.apiKey && providedKey !== existingDevice.apiKey) {
        return NextResponse.json(
          { success: false, error: "Invalid per-device IoT key" },
          { status: 401 }
        );
      }
    } catch {
      // Postgres offline — continue with memory fallback
    }
  }

  const waitMs = rateLimit(`iot:${d.deviceId}`, IOT_PING_INTERVAL_MS);
  if (waitMs > 0) {
    return NextResponse.json(
      { success: false, error: "IoT device polling too fast" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(waitMs / 1000)) } }
    );
  }

  const latitude = (d.latitude ?? d.lat)!;
  const longitude = (d.longitude ?? d.lng ?? d.lon)!;
  const accuracyMeters = d.accuracyMeters ?? (d.hdop != null ? d.hdop * 5 : 10);

  const result = await ingestTelemetry({
    deviceId: d.deviceId,
    busId: d.busId,
    busNumber: d.busNumber || d.bus || "S-12",
    regNumber: d.regNumber,
    source: "ESP_IOT",
    latitude,
    longitude,
    accuracyMeters,
    speedKmh: d.speedKmh ?? d.speed,
    heading: d.heading ?? d.course,
    satellites: d.satellites ?? d.sats,
    batteryPct: d.batteryPct ?? d.batt,
    signalRssi: d.signalRssi ?? d.rssi,
    hardwareType: d.hardwareType || "ESP32_NEO6M",
    firmwareVersion: d.firmwareVersion || "1.2.0",
    occupancyStatus: d.occupancyStatus,
    status: d.status,
  });

  return NextResponse.json(result);
}
