"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bookmark,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KOLKATA_ROUTES, KOLKATA_STOPS } from "@/lib/data";
import { useRoutes, useStops } from "@/lib/api";
import { useSavedTransit } from "@/lib/useSavedTransit";

function formatRelativeTime(iso: string): string {
  const diffMins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (diffMins < 60) return `${diffMins}m ago`;
  const hrs = Math.floor(diffMins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SavedPageContent() {
  const { data: apiRoutes } = useRoutes();
  const { data: apiStops } = useStops();
  const {
    savedRouteIds,
    savedStopIds,
    recentSearches,
    toggleSavedRoute,
    toggleSavedStop,
    clearRecentSearches,
  } = useSavedTransit();

  const routes = apiRoutes.length > 0 ? apiRoutes : KOLKATA_ROUTES;
  const stops = apiStops.length > 0 ? apiStops : KOLKATA_STOPS;

  const favoriteRoutes = routes.filter((r) => savedRouteIds.includes(r.id));
  const favoriteStops = stops.filter((s) => savedStopIds.includes(s.id));

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* ─── Top Header Banner ─── */}
      <div className="glass-chocolate-hero p-5.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-[#F8F4E7] drop-shadow-xs">
              Saved Hubs & Corridors
            </h1>
            <span className="bg-[#CC5500] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border border-white/30 shadow-sm flex items-center gap-1">
              <Star className="h-3 w-3 fill-white text-white" />
              Saved Locally
            </span>
          </div>
          <p className="text-xs text-[#F8F4E7]/85 mt-1 max-w-xl leading-relaxed">
            Instant 1-click access to your pinned Kolkata transit routes, junction stops, and recent searches
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/25 backdrop-blur-xl border border-white/20 text-[#F8F4E7] text-xs font-bold shadow-inner">
            <Bookmark className="h-4 w-4 text-[#CC5500]" />
            <span>{favoriteRoutes.length + favoriteStops.length} Pinned</span>
          </div>
        </div>
      </div>

      {/* ─── Responsive Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (7 cols): Pinned Corridors & Favorite Hubs */}
        <div className="lg:col-span-7 space-y-4">
          <Tabs defaultValue="buses" className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-[#4E342E]/85 backdrop-blur-2xl border border-white/20 border-t-white/35 h-10.5 p-1 rounded-xl shadow-[0_8px_24px_rgba(78,52,46,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] text-[#F8F4E7]">
              <TabsTrigger
                value="buses"
                className="text-xs font-bold data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(204,85,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] data-[state=active]:border data-[state=active]:border-white/30 text-[#F8F4E7]/80 hover:text-white"
              >
                Favorite Routes ({favoriteRoutes.length})
              </TabsTrigger>
              <TabsTrigger
                value="stops"
                className="text-xs font-bold data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:shadow-[0_4px_12px_rgba(204,85,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] data-[state=active]:border data-[state=active]:border-white/30 text-[#F8F4E7]/80 hover:text-white"
              >
                Saved Stops ({favoriteStops.length})
              </TabsTrigger>
            </TabsList>

            {/* Favorite Routes Tab */}
            <TabsContent value="buses" className="space-y-2.5 mt-3">
              {favoriteRoutes.length === 0 ? (
                <div className="p-6 rounded-xl bg-white/50 border border-white/75 text-center text-xs text-[#7E655D] space-y-2">
                  <p>No favorite routes saved yet.</p>
                  <Link href="/search" className="inline-block font-bold text-[#CC5500] hover:underline">
                    Browse Routes & Bookmark →
                  </Link>
                </div>
              ) : (
                favoriteRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="p-4 rounded-xl border border-white/75 border-b-[#4E342E]/15 bg-white/50 backdrop-blur-xl hover:bg-white/70 shadow-[0_6px_20px_rgba(78,52,46,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)] hover:border-[#CC5500]/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-md border shrink-0 ${
                            route.busType === "AC_EXPRESS"
                              ? "bg-[#CC5500] text-white border-white/30 shadow-xs"
                              : "bg-[#4E342E] text-white border-white/20"
                          }`}
                        >
                          {route.routeNumber}
                        </span>
                        <span className="text-xs font-bold text-[#4E342E] truncate">
                          {route.source} ⇄ {route.destination}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#7E655D]">
                        <Clock className="h-3.5 w-3.5 text-[#CC5500]" />
                        <span>Every {route.frequencyMins}m</span>
                        <span>·</span>
                        <span className="text-[#CC5500] font-bold">
                          ₹{route.fareMin}–₹{route.fareMax}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleSavedRoute(route.id)}
                        title="Remove saved route"
                        className="p-2 rounded-xl text-[#7E655D] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link href={`/?route=${encodeURIComponent(route.routeNumber)}`}>
                        <Button
                          size="sm"
                          className="h-8.5 text-xs font-bold px-3.5 bg-[#CC5500] hover:bg-[#B34700] text-white border border-white/30 shadow-[0_4px_14px_rgba(204,85,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] rounded-xl"
                        >
                          Track Live
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Saved Stops Tab */}
            <TabsContent value="stops" className="space-y-2.5 mt-3">
              {favoriteStops.length === 0 ? (
                <div className="p-6 rounded-xl bg-white/50 border border-white/75 text-center text-xs text-[#7E655D] space-y-2">
                  <p>No saved stops yet. Tap the bookmark icon on any stop on the Live Radar.</p>
                  <Link href="/" className="inline-block font-bold text-[#CC5500] hover:underline">
                    Back to Live Radar →
                  </Link>
                </div>
              ) : (
                favoriteStops.map((stop) => (
                  <div
                    key={stop.id}
                    className="p-4 rounded-xl border border-white/75 border-b-[#4E342E]/15 bg-white/50 backdrop-blur-xl hover:bg-white/70 shadow-[0_6px_20px_rgba(78,52,46,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)] hover:border-[#CC5500]/40 transition-all flex items-center justify-between gap-2"
                  >
                    <Link
                      href={`/search?from=${encodeURIComponent(stop.name)}`}
                      className="flex items-center gap-3 min-w-0 flex-1"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#4E342E]/86 text-[#CC5500] flex items-center justify-center shrink-0 shadow-sm border border-white/25">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-[#4E342E] truncate">
                          {stop.name} ({stop.bengaliName})
                        </h3>
                        <p className="text-[11px] text-[#7E655D] truncate">{stop.landmark}</p>
                        <p className="text-[10px] text-[#CC5500] font-bold mt-0.5">
                          {stop.connectingRoutes?.length || 0} connecting lines
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleSavedStop(stop.id)}
                        title="Remove saved stop"
                        className="p-2 rounded-xl text-[#7E655D] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link href={`/search?from=${encodeURIComponent(stop.name)}`} className="p-1.5 text-[#4E342E]">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column (5 cols): Recent Journeys & Offline Cache */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-white/60 border-b-[#4E342E]/15 bg-white/55 backdrop-blur-2xl shadow-[0_16px_40px_rgba(78,52,46,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <div className="bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] p-4 border-b border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#F8F4E7] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#CC5500]" />
                Recent Journey Inquiries
              </span>
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="text-[10px] text-[#F8F4E7]/75 hover:text-white font-mono cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="p-4.5 space-y-2.5 bg-white/40 backdrop-blur-xl">
              {recentSearches.length === 0 ? (
                <p className="text-xs text-[#7E655D] text-center py-4">
                  No recent searches yet. Search a route in Routes & Search to log it here.
                </p>
              ) : (
                recentSearches.map((item) => (
                  <Link
                    key={item.id}
                    href={`/search?from=${encodeURIComponent(item.from)}&to=${encodeURIComponent(item.to)}`}
                    className="p-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/80 flex items-center justify-between text-xs hover:border-[#CC5500]/40 hover:bg-white/80 shadow-xs transition-all gap-2"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-[#4E342E] font-bold truncate">
                        {item.from} → {item.to}
                      </p>
                      <p className="text-[10px] text-[#CC5500] font-mono font-bold truncate">
                        Lines: {item.lines}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#7E655D] font-medium shrink-0">
                      {formatRelativeTime(item.timestampIso)}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="p-4.5 rounded-2xl bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] border border-white/20 shadow-[0_12px_32px_rgba(78,52,46,0.25),inset_0_1px_1px_rgba(255,255,255,0.25)] text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-[#F8F4E7] font-bold">
              <ShieldCheck className="h-4 w-4 text-[#CC5500]" />
              <span>
                Offline Route Cache Active ({routes.length} routes · {stops.length} stops)
              </span>
            </div>
            <p className="text-[11px] text-[#F8F4E7]/85 leading-relaxed">
              Kolkata stops, route tables, and your pinned items are cached in your browser so navigation works even in low-reception tunnels and river crossings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SavedPage() {
  return <SavedPageContent />;
}
