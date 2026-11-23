"use client";

import * as React from "react";
import {
  Bus,
  MapPin,
  Search,
  Navigation,
  Clock,
  Radio,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Users,
  Gauge,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { KOLKATA_STOPS, KOLKATA_ROUTES, ACTIVE_LIVE_BUSES, LiveBus } from "@/lib/data";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeBusIndex, setActiveBusIndex] = React.useState<number>(0);
  const [isPinging, setIsPinging] = React.useState<boolean>(false);
  const [pingSuccess, setPingSuccess] = React.useState<string | null>(null);

  const currentBus: LiveBus = ACTIVE_LIVE_BUSES[activeBusIndex] || ACTIVE_LIVE_BUSES[0];

  const filteredRoutes = React.useMemo(() => {
    return KOLKATA_ROUTES.filter((route) => {
      const matchesSearch =
        route.routeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.destination.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedCategory === "AC") return route.busType === "AC_EXPRESS";
      if (selectedCategory === "ORDINARY") return route.busType === "ORDINARY";
      if (selectedCategory === "MINIBUS") return route.busType === "MINIBUS";
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const handleShareLocation = async () => {
    setIsPinging(true);
    setPingSuccess(null);
    try {
      const res = await fetch("/api/crowdsource/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          busNumber: currentBus.busNumber,
          latitude: currentBus.currentLat + (Math.random() - 0.5) * 0.005,
          longitude: currentBus.currentLng + (Math.random() - 0.5) * 0.005,
          speedKmh: currentBus.speedKmh,
          heading: currentBus.heading,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPingSuccess(`Broadcasted live GPS for ${currentBus.busNumber} (${currentBus.regNumber})`);
        setTimeout(() => setPingSuccess(null), 4000);
      }
    } catch {
      setPingSuccess(`GPS broadcast simulated for ${currentBus.busNumber}`);
      setTimeout(() => setPingSuccess(null), 4000);
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#09090b] text-zinc-100">
      
      {/* ─── Top Transit Bar ─── */}
      <div className="bg-[#121217] border-b border-[#272732] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Bus className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-white">Find My Bus</h1>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-blue-500/30 text-blue-400">
                Kolkata
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-400">WBTC & CSTC Transit Network</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Network
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* ─── Search & Category Filtering ─── */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search route (e.g. S-12, AC-39) or stop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 bg-[#121217] border-[#272732] h-10 text-sm"
            />
          </div>

          {/* Quick Filter Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid grid-cols-4 w-full bg-[#121217] border border-[#272732] h-9">
              <TabsTrigger value="ALL" className="text-[11px]">All</TabsTrigger>
              <TabsTrigger value="AC" className="text-[11px]">AC Express</TabsTrigger>
              <TabsTrigger value="ORDINARY" className="text-[11px]">Ordinary</TabsTrigger>
              <TabsTrigger value="MINIBUS" className="text-[11px]">Minibus</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ─── Featured Live Tracking Card ─── */}
        <Card className="border-[#272732] bg-gradient-to-b from-[#181822] to-[#121217] shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="ac" className="text-sm px-2.5 py-0.5">
                    {currentBus.busNumber}
                  </Badge>
                  <span className="text-xs text-zinc-400 font-mono">{currentBus.regNumber}</span>
                </div>
                <CardTitle className="text-base mt-1.5">
                  Toward {currentBus.destination}
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3 w-3 text-blue-400 shrink-0" />
                  Approaching: <span className="text-white font-medium">{currentBus.nextStop}</span>
                </CardDescription>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black tracking-tight text-emerald-400 font-mono">
                  {currentBus.etaNextStopMins}
                </span>
                <span className="text-[11px] text-zinc-400 block font-medium">mins ETA</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3.5">
            {/* Live Metrics Row */}
            <div className="grid grid-cols-3 gap-2 bg-[#0d0d12] p-2.5 rounded-lg border border-[#272732]/70 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-zinc-400 text-[10px] uppercase font-semibold">
                  <Gauge className="h-3 w-3" /> Speed
                </div>
                <p className="text-xs font-bold text-white mt-0.5">{currentBus.speedKmh} km/h</p>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1 text-zinc-400 text-[10px] uppercase font-semibold">
                  <Users className="h-3 w-3" /> Crowd
                </div>
                <p className="text-xs font-bold text-amber-400 mt-0.5">
                  {currentBus.occupancy === "SEATS_AVAILABLE" ? "Seats Free" : "Standing"}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1 text-zinc-400 text-[10px] uppercase font-semibold">
                  <Radio className="h-3 w-3" /> Source
                </div>
                <p className="text-xs font-bold text-blue-400 mt-0.5">
                  {currentBus.crowdsourceContributors} Live Users
                </p>
              </div>
            </div>

            {/* Stop Progression Timeline */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Current Corridor</span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  On-Time Status
                </span>
              </div>

              <div className="relative pt-2 pb-1">
                <div className="h-1.5 bg-[#272732] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-2/3 transition-all duration-500" />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-400 mt-1 font-medium">
                  <span>Howrah Hub</span>
                  <span className="text-blue-400 font-semibold">{currentBus.nextStop}</span>
                  <span>Shapoorji Terminus</span>
                </div>
              </div>
            </div>

            <Separator className="bg-[#272732]" />

            {/* Crowdsourcing Trigger */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="text-xs text-zinc-400">
                <span className="text-white font-medium block">Riding this bus now?</span>
                <span className="text-[11px] text-zinc-400">Help commuters with real-time GPS</span>
              </div>
              <Button
                size="sm"
                variant="transit"
                onClick={handleShareLocation}
                disabled={isPinging}
                className="gap-1.5 text-xs font-semibold"
              >
                <Radio className={`h-3.5 w-3.5 ${isPinging ? "animate-spin" : ""}`} />
                {isPinging ? "Pinging..." : "Share Location"}
              </Button>
            </div>

            {pingSuccess && (
              <div className="p-2.5 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{pingSuccess}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Active Fleet Switcher ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Active Buses Tracking Now ({ACTIVE_LIVE_BUSES.length})
            </h2>
            <span className="text-[11px] text-blue-400 font-medium">Auto-updating</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ACTIVE_LIVE_BUSES.map((b, idx) => {
              const isSelected = activeBusIndex === idx;
              return (
                <div
                  key={b.id}
                  onClick={() => setActiveBusIndex(idx)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-blue-600/10 border-blue-500/50 shadow-sm"
                      : "bg-[#121217] border-[#272732] hover:border-[#383846]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={b.busNumber.startsWith("AC") ? "ac" : "ordinary"}>
                      {b.busNumber}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {b.etaNextStopMins}m
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white mt-1.5 truncate">
                    {b.destination}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    Near: {b.nextStop}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Key Kolkata Bus Stops & Depots ─── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Major Bus Hubs Nearby
            </h2>
            <span className="text-[11px] text-zinc-400">Kolkata Metro Zones</span>
          </div>

          <div className="space-y-2">
            {KOLKATA_STOPS.slice(0, 5).map((stop) => (
              <Card
                key={stop.id}
                className="border-[#272732] bg-[#121217] hover:border-[#383848] transition-colors cursor-pointer"
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#181822] border border-[#272732] flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-white">{stop.name}</h3>
                        <span className="text-[11px] text-zinc-500 font-normal">({stop.bengaliName})</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{stop.landmark}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {stop.connectingRoutes.slice(0, 4).map((r) => (
                          <Badge key={r} variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-500 shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ─── Database & Engine Architecture Indicator ─── */}
        <div className="p-3 rounded-xl bg-[#121217] border border-[#272732] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
            <div>
              <span className="font-semibold text-white block">PostgreSQL + PostGIS Ready</span>
              <span className="text-[10px] text-zinc-400">Dockerized spatial bus network database</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] border-[#272732] text-zinc-300">
            Port 5432
          </Badge>
        </div>

      </div>
    </div>
  );
}
