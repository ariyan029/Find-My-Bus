import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BUS_STATUSES, OCCUPANCIES } from "@/lib/enums";
import { ingestTelemetry } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

/** Minimum gap between pings from the same contributor. */
const PING_INTERVAL_MS = 5_000;

const PingSchema = z.object({
  busNumber: z.string().trim().min(1).max(32),
  busId: z.string().trim().min(1).max(64).optional(),
  contributorId: z.string().trim().min(8).max(64).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(10_000).optional(),
  speedKmh: z.number().min(0).max(200).nullish(),
  heading: z.number().min(0).max(360).nullish(),
  occupancyStatus: z.enum(OCCUPANCIES).optional(),
  status: z.enum(BUS_STATUSES).optional(),
});

function clientKey(request: NextRequest, contributorId?: string): string {
  if (contributorId) return `c:${contributorId}`;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${ip || "unknown"}`;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Body must be valid JSON" }, { status: 400 });
  }

  const parsed = PingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid ping", issues: z.flattenError(parsed.error).fieldErrors },
      { status: 400 }
    );
  }
  const ping = parsed.data;

  const waitMs = rateLimit(clientKey(request, ping.contributorId), PING_INTERVAL_MS);
  if (waitMs > 0) {
    return NextResponse.json(
      { success: false, error: "Too many pings, slow down" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(waitMs / 1000)) } }
    );
  }

  const result = await ingestTelemetry({
    busId: ping.busId,
    busNumber: ping.busNumber,
    contributorId: ping.contributorId,
    source: "COMMUTER_CROWD",
    latitude: ping.latitude,
    longitude: ping.longitude,
    accuracyMeters: ping.accuracyMeters,
    speedKmh: ping.speedKmh,
    heading: ping.heading,
    occupancyStatus: ping.occupancyStatus,
    status: ping.status,
  });

  return NextResponse.json(result);
}
