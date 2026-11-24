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
      
      {/* ─── Top Header Banner (35% Chocolate Anchor + 25% Burnt Orange Energy) ─── */}
      <div className="surface-chocolate-hero p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-[#F8F4E7]">Saved Hubs & Corridors</h1>
            <Badge className="bg-[#CC5500] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 border-0 shadow-sm flex items-center gap-1">
              <Star className="h-3 w-3 fill-white text-white" />
              Frequent Commutes
            </Badge>
          </div>
          <p className="text-xs text-[#F8F4E7]/80 mt-1 max-w-xl leading-relaxed">
            Instant 1-click access to your daily Kolkata transit routes, pinboards, and junction stops
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#CC5500]/25 border border-[#CC5500]/45 text-[#F8F4E7] text-xs font-bold shadow-inner">
            <Bookmark className="h-4 w-4 text-[#CC5500]" />
            <span>Fast Dispatch Hub</span>
          </div>
        </div>
      </div>

      {/* ─── Responsive Layout (Desktop: 2 Columns / Mobile: Stacked) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (7 cols): Pinned Corridors & Favorite Hubs */}
        <div className="lg:col-span-7 space-y-4">
          <Tabs defaultValue="buses" className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-[#4E342E] border border-[#CC5500]/25 h-10 p-1 rounded-xl shadow-inner text-[#F8F4E7]">
              <TabsTrigger 
                value="buses" 
                className="text-xs font-bold data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:shadow-sm text-[#F8F4E7]/80 hover:text-white"
              >
                Favorite Routes ({favoriteRoutes.length})
              </TabsTrigger>
              <TabsTrigger 
                value="stops" 
                className="text-xs font-bold data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:shadow-sm text-[#F8F4E7]/80 hover:text-white"
              >
                Saved Stops ({favoriteStops.length})
              </TabsTrigger>
            </TabsList>

            {/* ─── Favorite Buses Tab ─── */}
            <TabsContent value="buses" className="space-y-2.5 mt-3">
              {favoriteRoutes.map((route) => (
                <div 
                  key={route.id} 
                  className="p-4 rounded-xl border border-[#4E342E]/16 bg-white/85 backdrop-blur-xl shadow-sm hover:border-[#CC5500]/40 hover:shadow-md transition-all flex items-center justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                        route.busType === "AC_EXPRESS" ? "bg-[#CC5500] text-white" : "bg-[#4E342E] text-white"
                      }`}>
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
                      <span className="text-[#CC5500] font-bold">● Active Fleet Running</span>
                    </div>
                  </div>

                  <Button size="sm" className="h-8.5 text-xs font-bold px-3.5 bg-[#CC5500] hover:bg-[#B34700] text-white shadow-sm rounded-xl">
                    Track Live
                  </Button>
                </div>
              ))}
            </TabsContent>

            {/* ─── Saved Stops Tab ─── */}
            <TabsContent value="stops" className="space-y-2.5 mt-3">
              {favoriteStops.map((stop) => (
                <div 
                  key={stop.id} 
                  className="p-4 rounded-xl border border-[#4E342E]/16 bg-white/85 backdrop-blur-xl shadow-sm hover:border-[#CC5500]/40 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#4E342E] text-[#CC5500] flex items-center justify-center shrink-0 shadow-sm border border-[#CC5500]/25">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#4E342E]">{stop.name}</h3>
                      <p className="text-[11px] text-[#7E655D]">{stop.landmark}</p>
                      <p className="text-[10px] text-[#CC5500] font-bold mt-0.5">{stop.connectingRoutes?.length || 0} connecting lines</p>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-[#4E342E]" />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column (5 cols): Recent Journeys & Offline Cache */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-[#4E342E]/20 bg-white/85 backdrop-blur-xl shadow-[0_10px_30px_-8px_rgba(78,52,46,0.12)]">
            <div className="bg-[#4E342E] text-[#F8F4E7] p-3.5 px-4 border-b border-[#CC5500]/30 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#F8F4E7] flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#CC5500]" />
                Recent Journey Inquiries
              </span>
              <span className="text-[10px] text-[#F8F4E7]/70 font-mono">History</span>
            </div>

            <div className="p-4 space-y-2.5 bg-[#F8F4E7]/80">
              {[
                { query: "Howrah Station to Salt Lake Sector V", time: "Today at 08:45 AM", lines: "S-12, C-11" },
                { query: "AC-39 Airport schedule", time: "Yesterday at 06:15 PM", lines: "AC-39" },
                { query: "Gariahat to Shyambazar crossing", time: "2 days ago", lines: "AC-12, 212" },
                { query: "Jadavpur 8B to Karunamoyee", time: "3 days ago", lines: "S-9" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white border border-[#4E342E]/12 flex items-center justify-between text-xs cursor-pointer hover:border-[#CC5500]/40 shadow-xs transition-all"
                >
                  <div className="space-y-0.5">
                    <p className="text-[#4E342E] font-bold">{item.query}</p>
                    <p className="text-[10px] text-[#CC5500] font-mono font-bold">Lines: {item.lines}</p>
                  </div>
                  <span className="text-[10px] text-[#7E655D] font-medium shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Offline Sync State Card */}
          <div className="p-4 rounded-2xl bg-[#4E342E] text-[#F8F4E7] border border-[#CC5500]/30 shadow-md text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-[#F8F4E7] font-bold">
              <ShieldCheck className="h-4 w-4 text-[#CC5500]" />
              <span>Offline Route Cache Active</span>
            </div>
            <p className="text-[11px] text-[#F8F4E7]/80 leading-relaxed">
              Key Kolkata stops and route tables are locally stored in your browser cache for low-reception metro tunnels and river corridors.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
