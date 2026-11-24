"use client";

import * as React from "react";
import {
  Bookmark,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Bus,
  Trash2,
  Navigation,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KOLKATA_ROUTES, KOLKATA_STOPS } from "@/lib/data";
import { useRoutes, useStops } from "@/lib/api";

export default function SavedPage() {
  const { data: apiRoutes } = useRoutes();
  const { data: apiStops } = useStops();

  const routes = apiRoutes.length > 0 ? apiRoutes : KOLKATA_ROUTES;
  const stops = apiStops.length > 0 ? apiStops : KOLKATA_STOPS;

  const favoriteRoutes = routes.slice(0, 3);
  const favoriteStops = stops.slice(0, 4);

  return (
    <div className="flex-1 flex flex-col space-y-5">
      {/* ─── Top Header Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-[#4E342E]/12 shadow-[0_4px_20px_-4px_rgba(78,52,46,0.04)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-[#4E342E]">Saved Hubs & Corridors</h1>
            <Badge variant="outline" className="text-xs border-[#CC5500]/30 text-[#CC5500] bg-[#CC5500]/8 gap-1 font-semibold">
              <Star className="h-3 w-3 fill-[#CC5500] text-[#CC5500]" />
              Frequent Commutes
            </Badge>
          </div>
          <p className="text-xs text-[#7E655D] mt-0.5">
            Instant 1-click access to your daily Kolkata transit routes and favorite junction stops
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4E342E]/6 border border-[#4E342E]/10 text-xs text-[#4E342E] font-medium">
            <Bookmark className="h-3.5 w-3.5 text-[#CC5500]" />
            <span>Fast Dispatch</span>
          </div>
        </div>
      </div>

      {/* ─── Responsive Layout (Desktop: 2 Columns / Mobile: Stacked) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (7 cols): Pinned Corridors & Favorite Hubs */}
        <div className="lg:col-span-7 space-y-4">
          <Tabs defaultValue="buses" className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-[#4E342E]/8 border border-[#4E342E]/12 h-9">
              <TabsTrigger value="buses" className="text-xs font-bold">Favorite Routes ({favoriteRoutes.length})</TabsTrigger>
              <TabsTrigger value="stops" className="text-xs font-bold">Saved Stops ({favoriteStops.length})</TabsTrigger>
            </TabsList>

            {/* ─── Favorite Buses Tab ─── */}
            <TabsContent value="buses" className="space-y-2.5 mt-3">
              {favoriteRoutes.map((route) => (
                <Card key={route.id} className="border-[#4E342E]/14 bg-white/80 backdrop-blur-xl shadow-sm hover:border-[#4E342E]/25 transition-all">
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={route.busType === "AC_EXPRESS" ? "ac" : "ordinary"} className="font-black">
                          {route.routeNumber}
                        </Badge>
                        <span className="text-xs font-bold text-[#4E342E] truncate">
                          {route.source} ⇄ {route.destination}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#7E655D]">
                        <Clock className="h-3 w-3 text-[#7E655D]" />
                        <span>Every {route.frequencyMins}m</span>
                        <span>·</span>
                        <span className="text-emerald-800 font-semibold">Active Fleet Running</span>
                      </div>
                    </div>

                    <Button size="sm" variant="transit" className="h-8 text-xs font-bold px-3">
                      Track Live
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* ─── Saved Stops Tab ─── */}
            <TabsContent value="stops" className="space-y-2.5 mt-3">
              {favoriteStops.map((stop) => (
                <Card key={stop.id} className="border-[#4E342E]/14 bg-white/80 backdrop-blur-xl shadow-sm hover:border-[#4E342E]/25 transition-all">
                  <CardContent className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#CC5500]/12 border border-[#CC5500]/25 flex items-center justify-center shrink-0">
                        <MapPin className="h-4 w-4 text-[#CC5500]" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#4E342E]">{stop.name}</h3>
                        <p className="text-[11px] text-[#7E655D]">{stop.landmark}</p>
                        <p className="text-[10px] text-[#7E655D]/80 mt-0.5">{stop.connectingRoutes?.length || 0} connecting lines</p>
                      </div>
                    </div>

                    <ArrowRight className="h-4 w-4 text-[#7E655D]" />
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column (5 cols): Recent Journeys & Offline Cache */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-[#4E342E]/14 bg-white/80 backdrop-blur-xl shadow-sm">
            <CardHeader className="p-4 pb-2.5 border-b border-[#4E342E]/8">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-[#4E342E] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#CC5500]" />
                Recent Journey Inquiries
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-2">
              {[
                { query: "Howrah Station to Salt Lake Sector V", time: "Today at 08:45 AM", lines: "S-12, C-11" },
                { query: "AC-39 Airport schedule", time: "Yesterday at 06:15 PM", lines: "AC-39" },
                { query: "Gariahat to Shyambazar crossing", time: "2 days ago", lines: "AC-12, 212" },
                { query: "Jadavpur 8B to Karunamoyee", time: "3 days ago", lines: "S-9" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/70 border border-[#4E342E]/10 flex items-center justify-between text-xs cursor-pointer hover:border-[#4E342E]/25 hover:bg-white shadow-sm transition-all"
                >
                  <div className="space-y-0.5">
                    <p className="text-[#4E342E] font-bold">{item.query}</p>
                    <p className="text-[10px] text-[#7E655D] font-mono">Lines: {item.lines}</p>
                  </div>
                  <span className="text-[10px] text-[#7E655D] font-medium shrink-0">{item.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Offline Sync State Card */}
          <div className="p-4 rounded-2xl bg-white/60 border border-[#4E342E]/12 shadow-sm text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-[#4E342E] font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
              <span>Offline Route Cache Active</span>
            </div>
            <p className="text-[11px] text-[#7E655D]">
              Key Kolkata stops and route tables are locally stored for low-reception metro tunnels.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
