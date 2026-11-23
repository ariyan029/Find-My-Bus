import { NextRequest, NextResponse } from "next/server";
import { getLiveBuses } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const route = searchParams.get("route") || undefined;
  
  const buses = await getLiveBuses(route);
  return NextResponse.json({
    success: true,
    count: buses.length,
    buses,
  });
}
