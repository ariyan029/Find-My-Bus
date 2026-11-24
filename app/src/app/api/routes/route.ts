import { NextRequest, NextResponse } from "next/server";
import { getRoutes } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || undefined;
  
  const routes = await getRoutes(query);
  return NextResponse.json(
    {
      success: true,
      count: routes.length,
      routes,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    }
  );
}
