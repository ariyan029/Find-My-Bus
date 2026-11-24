import { NextRequest, NextResponse } from "next/server";
import { getLiveBusesWithMeta } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const route = searchParams.get("route") || undefined;

  const { buses, storageMode } = await getLiveBusesWithMeta(route);
  return NextResponse.json({
    success: true,
    count: buses.length,
    storageMode,
    buses,
  });
}
