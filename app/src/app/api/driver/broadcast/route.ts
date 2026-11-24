import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ingestTelemetry } from "@/lib/db";
import { BUS_STATUSES, OCCUPANCIES } from "@/lib/enums";
import { rateLimit } from "@/lib/rateLimit";

const DRIVER_PING_INTERVAL_MS = 2_000;

const DriverBroadcastSchema = z.object({
  busId: z.string().trim().min(1).max(64).optional(),
  busNumber: z.string().trim().min(1).max(32),
  regNumber: z.string().trim().min(1).max(32).optional(),
  driverId: z.string().trim().min(4).max(64).optional(),
  driverName: z.string().trim().min(1).max(128).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(10_000).optional(),
  speedKmh: z.number().min(0).max(200).nullish(),
  heading: z.number().min(0).max(360).nullish(),
  occupancyStatus: z.enum(OCCUPANCIES).optional(),
  status: z.enum(BUS_STATUSES).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Body must be valid JSON" }, { status: 400 });
  }

  const parsed = DriverBroadcastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid driver broadcast payload",
        issues: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const driverKey = d.driverId || d.busId || d.busNumber;
  const waitMs = rateLimit(`driver:${driverKey}`, DRIVER_PING_INTERVAL_MS);
  if (waitMs > 0) {
    return NextResponse.json(
      { success: false, error: "Too many driver updates" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(waitMs / 1000)) } }
    );
  }

  const result = await ingestTelemetry({
    busId: d.busId,
    busNumber: d.busNumber,
    regNumber: d.regNumber,
    driverName: d.driverName,
    contributorId: d.driverId,
    source: "DRIVER_APP",
    latitude: d.latitude,
    longitude: d.longitude,
    accuracyMeters: d.accuracyMeters,
    speedKmh: d.speedKmh,
    heading: d.heading,
    occupancyStatus: d.occupancyStatus,
    status: d.status,
  });

  return NextResponse.json(result);
}
