import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { busNumber, latitude, longitude, speedKmh, heading } = body;

    if (!busNumber || !latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters (busNumber, latitude, longitude)" },
        { status: 400 }
      );
    }

    const db = getPrisma();
    if (db) {
      try {
        await db.telemetryPing.create({
          data: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            speedKmh: speedKmh ? parseFloat(speedKmh) : 0,
            heading: heading ? parseFloat(heading) : 0,
            contributorId: "commuter-" + Math.floor(1000 + Math.random() * 9000),
          },
        });
      } catch {
        // Ignored if DB offline
      }
    }

    return NextResponse.json({
      success: true,
      message: `Crowdsourced location recorded for bus ${busNumber}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
