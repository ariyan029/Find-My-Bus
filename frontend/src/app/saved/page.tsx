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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KOLKATA_ROUTES, KOLKATA_STOPS } from "@/lib/data";

export default function SavedPage() {
  const favoriteRoutes = KOLKATA_ROUTES.slice(0, 3);
  const favoriteStops = KOLKATA_STOPS.slice(0, 4);

  return (
    <div className="flex-1 flex flex-col bg-[#F8F4E7] text-[#4E342E] p-4 space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-[#4E342E] tracking-tight">Saved & Favorites</h1>
          <p className="text-xs text-[#7E655D]">Quick access to daily commute corridors</p>
        </div>
        <Badge variant="outline" className="text-xs border-[#CC5500]/30 text-[#CC5500] bg-[#CC5500]/8 gap-1 font-semibold">
          <Star className="h-3 w-3 fill-[#CC5500] text-[#CC5500]" />
          Frequent
        </Badge>
      </div>

      <Tabs defaultValue="buses" className="w-full">
        <TabsList className="grid grid-cols-2 w-full bg-[#4E342E]/8 border border-[#4E342E]/12 h-9">
          <TabsTrigger value="buses" className="text-xs">Favorite Routes (3)</TabsTrigger>
          <TabsTrigger value="stops" className="text-xs">Saved Stops (4)</TabsTrigger>
        </TabsList>

        {/* ─── Favorite Buses Tab ─── */}
        <TabsContent value="buses" className="space-y-2.5 mt-3">
          {favoriteRoutes.map((route) => (
            <Card key={route.id} className="border-[#4E342E]/14 bg-white/70 backdrop-blur-xl shadow-sm">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={route.busType === "AC_EXPRESS" ? "ac" : "ordinary"}>
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
                    <span className="text-emerald-800 font-semibold">Buses Active Now</span>
                  </div>
                </div>

                <Button size="sm" variant="transit" className="h-8 text-xs font-bold">
                  Track
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ─── Saved Stops Tab ─── */}
        <TabsContent value="stops" className="space-y-2.5 mt-3">
          {favoriteStops.map((stop) => (
            <Card key={stop.id} className="border-[#4E342E]/14 bg-white/70 backdrop-blur-xl shadow-sm">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#CC5500]/12 border border-[#CC5500]/25 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-[#CC5500]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#4E342E]">{stop.name}</h3>
                    <p className="text-[11px] text-[#7E655D]">{stop.landmark}</p>
                    <p className="text-[10px] text-[#7E655D]/80 mt-0.5">{stop.connectingRoutes.length} connecting lines</p>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 text-[#7E655D]" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* ─── Recent Trip Searches ─── */}
      <div className="space-y-2 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#4E342E]">
          Recent Searches
        </h2>

        <div className="space-y-1.5">
          {[
            { query: "Howrah Station to Salt Lake Sector V", time: "Today at 08:45 AM" },
            { query: "AC-39 Airport schedule", time: "Yesterday" },
            { query: "Gariahat to Shyambazar crossing", time: "2 days ago" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white/65 border border-[#4E342E]/12 flex items-center justify-between text-xs cursor-pointer hover:border-[#4E342E]/25 hover:bg-white/90 shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 text-[#4E342E] font-medium">
                <Clock className="h-3.5 w-3.5 text-[#7E655D]" />
                <span>{item.query}</span>
              </div>
              <span className="text-[10px] text-[#7E655D] font-medium">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
