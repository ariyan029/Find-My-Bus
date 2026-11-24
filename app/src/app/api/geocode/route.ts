import { NextRequest, NextResponse } from "next/server";
import { resolveLocalPlace } from "@/lib/transit";
import { getStops } from "@/lib/db";

interface CachedGeocode {
  lat: number;
  lng: number;
  label: string;
  source: "catalog" | "landmark" | "nominatim";
}

const GEOCODE_CACHE = new Map<string, CachedGeocode | null>();

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return NextResponse.json({ success: false, place: null }, { status: 400 });
  }

  const key = q.toLowerCase();
  if (GEOCODE_CACHE.has(key)) {
    const cached = GEOCODE_CACHE.get(key) ?? null;
    return NextResponse.json(
      { success: Boolean(cached), place: cached },
      { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } }
    );
  }

  const stops = await getStops();
  const local = resolveLocalPlace(q, stops);
  if (local) {
    const hit: CachedGeocode = {
      lat: local.lat,
      lng: local.lng,
      label: local.label,
      source: local.source,
    };
    GEOCODE_CACHE.set(key, hit);
    return NextResponse.json(
      { success: true, place: hit },
      { headers: { "Cache-Control": "public, max-age=86400" } }
    );
  }

  // Fallback to free OpenStreetMap Nominatim bounded to Greater Kolkata / North & South 24 Pgs / Howrah
  try {
    const queryWithRegion = /kolkata|barasat|howrah|west bengal|barrackpore/i.test(q)
      ? q
      : `${q}, Kolkata, West Bengal`;
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&limit=1` +
      `&viewbox=88.15,22.88,88.95,22.25&bounded=1` +
      `&q=${encodeURIComponent(queryWithRegion)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "PRAVAH-Kolkata-Transit/1.0 (https://github.com/ariyan029/Find-My-Bus)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(4500),
    });

    if (res.ok) {
      const items = (await res.json()) as Array<{
        lat: string;
        lon: string;
        display_name?: string;
      }>;
      if (items.length > 0) {
        const lat = Number(items[0].lat);
        const lng = Number(items[0].lon);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          const shortName = items[0].display_name?.split(",")[0]?.trim() || q;
          const hit: CachedGeocode = {
            lat,
            lng,
            label: shortName,
            source: "nominatim",
          };
          if (GEOCODE_CACHE.size > 500) GEOCODE_CACHE.clear();
          GEOCODE_CACHE.set(key, hit);
          return NextResponse.json(
            { success: true, place: hit },
            { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } }
          );
        }
      }
    }
  } catch {
    // Nominatim timeout or network issue — return null cleanly
  }

  GEOCODE_CACHE.set(key, null);
  return NextResponse.json({ success: false, place: null });
}
