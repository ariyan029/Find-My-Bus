import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

/** Minimum gap between pings from the same contributor. */
const PING_INTERVAL_MS = 5_000;
/** Fixes less accurate than this are logged but don't move the bus. */
const MAX_ACCURACY_FOR_POSITION_M = 100;

const PingSchema = z.object({
  busNumber: z.string().trim().min(1).max(32),
  busId: z.string().trim().min(1).max(64).optional(),
  contributorId: z.string().trim().min(8).max(64).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(10_000).optional(),
  speedKmh: z.number().min(0).max(200).nullish(),
  heading: z.number().min(0).max(360).nullish(),
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

  const db = getPrisma();
  if (!db) {
    return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
  }

  try {
    // Match the ping to a tracked bus: exact id if the client knows it, else by route number.
    const bus =
      (ping.busId ? await db.bus.findUnique({ where: { id: ping.busId } }) : null) ??
      (await db.bus.findFirst({
        where: { busNumber: { equals: ping.busNumber, mode: "insensitive" } },
        orderBy: { lastPing: "desc" },
      }));

    const routeId =
      bus?.routeId ??
      (await db.route.findFirst({
        where: { routeNumber: { equals: ping.busNumber, mode: "insensitive" } },
        select: { id: true },
      }))?.id ??
      null;

    const now = new Date();
    const goodFix = (ping.accuracyMeters ?? 0) <= MAX_ACCURACY_FOR_POSITION_M;

    await db.$transaction([
      db.telemetryPing.create({
        data: {
          busId: bus?.id ?? null,
          routeId,
          contributorId: ping.contributorId ?? null,
          latitude: ping.latitude,
          longitude: ping.longitude,
          accuracyMeters: ping.accuracyMeters ?? null,
          speedKmh: ping.speedKmh ?? null,
          heading: ping.heading ?? null,
          recordedAt: now,
        },
      }),
      ...(bus && goodFix
        ? [
            db.bus.update({
              where: { id: bus.id },
              data: {
                currentLat: ping.latitude,
                currentLng: ping.longitude,
                ...(ping.speedKmh != null && { speedKmh: ping.speedKmh }),
                ...(ping.heading != null && { heading: ping.heading }),
                lastPing: now,
              },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({
      success: true,
      matchedBusId: bus?.id ?? null,
      updatedPosition: Boolean(bus && goodFix),
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("[crowdsource/ping] failed to record ping", err);
    return NextResponse.json(
      { success: false, error: "Could not save your location right now" },
      { status: 503 }
    );
  }
}
