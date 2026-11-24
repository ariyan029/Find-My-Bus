import { NextResponse } from "next/server";
import { getSystemHealth } from "@/lib/db";

export async function GET() {
  const health = await getSystemHealth();
  return NextResponse.json(health);
}
