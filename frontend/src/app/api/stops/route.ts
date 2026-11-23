import { NextResponse } from "next/server";
import { getStops } from "@/lib/db";

export async function GET() {
  const stops = await getStops();
  return NextResponse.json({
    success: true,
    count: stops.length,
    stops,
  });
}
