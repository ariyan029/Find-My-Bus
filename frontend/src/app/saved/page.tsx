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
import { useRoutes, useStops } from "@/lib/api";

export default function SavedPage() {
  // TODO: replace with the user's actual saved items (e.g. localStorage).
  const { data: routes } = useRoutes();
  const { data: stops } = useStops();
  const favoriteRoutes = routes.slice(0, 3);
  const favoriteStops = stops.slice(0, 4);

  return (
    <div className="flex-1 flex flex-col bg-[#09090b] text-zinc-100 p-4 space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Saved & Favorites</h1>
          <p className="text-xs text-zinc-400">Quick access to daily commute corridors</p>
        </div>
        <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 gap-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          Frequent
        </Badge>
      </div>

      <Tabs defaultValue="buses" className="w-full">
        <TabsList className="grid grid-cols-2 w-full bg-[#121217] border border-[#272732] h-9">
          <TabsTrigger value="buses" className="text-xs">Favorite Routes ({favoriteRoutes.length})</TabsTrigger>
          <TabsTrigger value="stops" className="text-xs">Saved Stops ({favoriteStops.length})</TabsTrigger>
        </TabsList>

        {/* ─── Favorite Buses Tab ─── */}
        <TabsContent value="buses" className="space-y-2.5 mt-3">
          {favoriteRoutes.map((route) => (
            <Card key={route.id} className="border-[#272732] bg-[#121217]">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={route.busType === "AC_EXPRESS" ? "ac" : "ordinary"}>
                      {route.routeNumber}
                    </Badge>
                    <span className="text-xs font-semibold text-white truncate">
                      {route.source} ⇄ {route.destination}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    <Clock className="h-3 w-3 text-zinc-500" />
                    <span>Every {route.frequencyMins}m</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-medium">Buses Active Now</span>
                  </div>
                </div>

                <Button size="sm" variant="outline" className="h-8 text-xs border-[#272732]">
                  Track
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ─── Saved Stops Tab ─── */}
        <TabsContent value="stops" className="space-y-2.5 mt-3">
          {favoriteStops.map((stop) => (
            <Card key={stop.id} className="border-[#272732] bg-[#121217]">
              <CardContent className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#181822] border border-[#272732] flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">{stop.name}</h3>
                    <p className="text-[11px] text-zinc-400">{stop.landmark}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{stop.connectingRoutes.length} connecting lines</p>
                  </div>
                </div>

                <ArrowRight className="h-4 w-4 text-zinc-500" />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* ─── Recent Trip Searches ─── */}
      <div className="space-y-2 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
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
              className="p-2.5 rounded-lg bg-[#121217] border border-[#272732] flex items-center justify-between text-xs cursor-pointer hover:border-[#383848]"
            >
              <div className="flex items-center gap-2 text-zinc-300">
                <Clock className="h-3.5 w-3.5 text-zinc-500" />
                <span>{item.query}</span>
              </div>
              <span className="text-[10px] text-zinc-500">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
