"use client";

import * as React from "react";
import dynamic from "next/dynamic";
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
  AlertCircle,
  Users,
  Gauge,
  Sparkles,
  Map as MapIcon,
  Filter,
  Layers,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { KOLKATA_STOPS, KOLKATA_ROUTES, ACTIVE_LIVE_BUSES, LiveBus } from "@/lib/data";
import { useLiveBuses, useStops } from "@/lib/api";
import { useLocationSharing } from "@/lib/useLocationSharing";
import { BUS_STATUS_LABELS, OCCUPANCY_LABELS } from "@/lib/enums";

const BusMap = dynamic(() => import("@/components/BusMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[380px] lg:h-[560px] w-full rounded-2xl bg-white/60 border border-[#4E342E]/14 flex flex-col items-center justify-center gap-3 p-6 text-[#7E655D]">
      <div className="w-8 h-8 rounded-xl bg-[#CC5500]/12 flex items-center justify-center animate-spin">
        <RefreshCw className="h-4 w-4 text-[#CC5500]" />
      </div>
      <p className="text-xs font-semibold">Loading PRAVAH Spatial Map...</p>
    </div>
  ),
});

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeBusIndex, setActiveBusIndex] = React.useState<number>(0);

  // Live data hooks from API with fallback
  const { data: apiBuses, loading: loadingBuses } = useLiveBuses(12000);
  const { data: apiStops, loading: loadingStops } = useStops();
  const sharing = useLocationSharing();

  const liveBuses = apiBuses.length > 0 ? apiBuses : ACTIVE_LIVE_BUSES;
  const stops = apiStops.length > 0 ? apiStops : KOLKATA_STOPS;

  const currentBus: LiveBus = liveBuses[activeBusIndex] || liveBuses[0] || ACTIVE_LIVE_BUSES[0];
  const isSharingCurrentBus = sharing.status === "sharing" && sharing.bus?.id === currentBus.id;
  const isSharingOtherBus = sharing.status === "sharing" && !isSharingCurrentBus;

  const filteredBuses = React.useMemo(() => {
    return liveBuses.filter((b) => {
      const matchSearch =
        b.busNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.nextStop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.regNumber.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (selectedCategory === "AC") return b.busNumber.startsWith("AC") || b.busNumber.startsWith("V");
      if (selectedCategory === "ORDINARY") return !b.busNumber.startsWith("AC") && !b.busNumber.includes("B");
      if (selectedCategory === "MINIBUS") return b.busNumber.includes("B") || b.busNumber.includes("mini");
      return true;
    });
  }, [liveBuses, searchQuery, selectedCategory]);

  return (
    <div className="flex-1 flex flex-col space-y-5">
      
      {/* ─── Top Dashboard Banner & Telemetry Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-[#4E342E]/12 shadow-[0_4px_20px_-4px_rgba(78,52,46,0.04)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-[#4E342E]">Live Transit Dashboard</h1>
            <Badge variant="outline" className="text-[10px] font-semibold border-[#CC5500]/30 text-[#CC5500] bg-[#CC5500]/8">
              Kolkata Region
            </Badge>
          </div>
          <p className="text-xs text-[#7E655D] mt-0.5">
            Real-time GPS telemetry from on-board commuters & WBTC regional fleet
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4E342E]/6 border border-[#4E342E]/10 text-xs text-[#4E342E] font-medium">
            <Radio className="h-3.5 w-3.5 text-[#CC5500]" />
            <span className="font-bold tabular-nums">{liveBuses.length}</span> Active Fleet Units
          </div>
        </div>
      </div>

      {/* ─── Search & Category Filter Header ─── */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E655D]" />
          <Input
            type="text"
            placeholder="Search bus line (e.g. S-12, AC-39), destination, or stop..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 bg-white/80 border-[#4E342E]/18 h-10 text-xs focus-visible:ring-[#CC5500]"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-4 md:flex w-full md:w-auto bg-[#4E342E]/8 border border-[#4E342E]/12 h-9 p-1">
            <TabsTrigger value="ALL" className="text-xs px-3">All Lines</TabsTrigger>
            <TabsTrigger value="AC" className="text-xs px-3">AC Express</TabsTrigger>
            <TabsTrigger value="ORDINARY" className="text-xs px-3">Ordinary</TabsTrigger>
            <TabsTrigger value="MINIBUS" className="text-xs px-3">Minibus</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ─── Production SaaS Responsive Split Layout (Desktop: 2 Columns / Mobile: Stacked) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (5 Cols on Desktop) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* ─── Selected Active Bus Hero Card ─── */}
          <Card className="border-[#4E342E]/16 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(78,52,46,0.08)]">
            <CardHeader className="pb-3 border-b border-[#4E342E]/8">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs px-2.5 py-0.5 bg-[#CC5500] text-[#F8F4E7] font-black tracking-wide shadow-sm">
                      {currentBus.busNumber}
                    </Badge>
                    <span className="text-xs text-[#7E655D] font-mono tracking-tight">{currentBus.regNumber}</span>
                  </div>
                  <CardTitle className="text-base mt-2 text-[#4E342E]">
                    Toward {currentBus.destination}
                  </CardTitle>
                  <CardDescription className="text-xs text-[#7E655D] flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-[#CC5500] shrink-0" />
                    Approaching: <span className="text-[#4E342E] font-bold">{currentBus.nextStop}</span>
                  </CardDescription>
                </div>

                <div className="text-right">
                  <span className="text-3xl font-black tracking-tight text-[#CC5500] font-mono tabular-nums block">
                    {currentBus.etaNextStopMins}
                  </span>
                  <span className="text-[11px] text-[#7E655D] font-bold uppercase tracking-wider">mins ETA</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              
              {/* Telemetry Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 bg-[#4E342E]/5 p-2.5 rounded-xl border border-[#4E342E]/8 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 text-[#7E655D] text-[10px] uppercase font-bold tracking-wider">
                    <Gauge className="h-3 w-3 text-[#7E655D]" /> Speed
                  </div>
                  <p className="text-xs font-bold text-[#4E342E] mt-0.5 font-mono tabular-nums">{currentBus.speedKmh} km/h</p>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1 text-[#7E655D] text-[10px] uppercase font-bold tracking-wider">
                    <Users className="h-3 w-3 text-[#7E655D]" /> Crowd
                  </div>
                  <p className="text-xs font-bold text-[#CC5500] mt-0.5">
                    {OCCUPANCY_LABELS[currentBus.occupancy] || "Seats Available"}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1 text-[#7E655D] text-[10px] uppercase font-bold tracking-wider">
                    <Radio className="h-3 w-3 text-[#7E655D]" /> Pings
                  </div>
                  <p className="text-xs font-bold text-[#4E342E] mt-0.5 font-mono tabular-nums">
                    {currentBus.crowdsourceContributors} Live
                  </p>
                </div>
              </div>

              {/* Corridor Timeline */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#7E655D]">
                  <span className="font-semibold text-[11px] uppercase tracking-wider">Corridor Progress</span>
                  <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    {BUS_STATUS_LABELS[currentBus.status] || "On-Time"}
                  </span>
                </div>

                <div className="relative pt-1 pb-1">
                  <div className="h-1.5 bg-[#4E342E]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#CC5500] rounded-full w-3/5 transition-all duration-500 shadow-sm" />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#7E655D] mt-1 font-semibold">
                    <span>Howrah Hub</span>
                    <span className="text-[#CC5500] font-bold">{currentBus.nextStop}</span>
                    <span>{currentBus.destination}</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-[#4E342E]/10" />

              {/* Real GPS Crowdsourcing Trigger */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="text-xs text-[#7E655D] leading-tight">
                  <span className="text-[#4E342E] font-bold block">On board this bus?</span>
                  <span className="text-[11px] text-[#7E655D]">
                    {isSharingOtherBus
                      ? `Sharing for ${sharing.bus?.busNumber} (${sharing.bus?.regNumber})`
                      : "Broadcast live GPS telemetry for Kolkata riders"}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant={isSharingCurrentBus ? "destructive" : "default"}
                  onClick={() => {
                    if (isSharingCurrentBus) {
                      sharing.stop();
                    } else {
                      sharing.start(currentBus);
                    }
                  }}
                  disabled={isSharingOtherBus || sharing.status === "locating"}
                  className={`gap-1.5 text-xs font-bold shrink-0 ${
                    !isSharingCurrentBus ? "bg-[#CC5500] text-[#F8F4E7] hover:bg-[#B34A00] shadow-sm" : ""
                  }`}
                >
                  <Radio className={`h-3.5 w-3.5 ${sharing.status === "locating" ? "animate-spin" : ""}`} />
                  {sharing.status === "locating"
                    ? "Acquiring..."
                    : isSharingCurrentBus
                    ? `Stop (${sharing.sentCount})`
                    : "Broadcast GPS"}
                </Button>
              </div>

              {sharing.status === "sharing" && isSharingCurrentBus && (
                <div className="p-2.5 rounded-xl bg-emerald-700/12 border border-emerald-700/25 text-emerald-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                    <span className="font-medium">
                      Broadcasting live GPS (sent {sharing.sentCount}
                      {sharing.accuracyMeters != null ? ` · ±${Math.round(sharing.accuracyMeters)}m` : ""})
                    </span>
                  </div>
                </div>
              )}

              {sharing.error && (
                <div className="p-2.5 rounded-xl bg-red-700/12 border border-red-700/25 text-red-900 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
                  <span>{sharing.error}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ─── Active Fleet Cards List ─── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#4E342E]">
                Active Fleet Units ({filteredBuses.length})
              </h2>
              <span className="text-[11px] text-[#CC5500] font-bold">Live Synced</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {filteredBuses.map((b, idx) => {
                const isSelected = activeBusIndex === idx;
                return (
                  <div
                    key={b.id}
                    onClick={() => setActiveBusIndex(idx)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-[#CC5500]/8 border-[#CC5500] shadow-[0_4px_16px_rgba(204,85,0,0.1)]"
                        : "bg-white/70 border-[#4E342E]/12 hover:border-[#4E342E]/25 hover:bg-white/95 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#4E342E]/8 border border-[#4E342E]/12 flex items-center justify-center shrink-0">
                        <Bus className="h-4 w-4 text-[#CC5500]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#4E342E]">{b.busNumber}</span>
                          <span className="text-[10px] text-[#7E655D] font-mono">{b.regNumber}</span>
                        </div>
                        <p className="text-xs text-[#4E342E] font-medium truncate mt-0.5">
                          Toward {b.destination}
                        </p>
                        <p className="text-[10px] text-[#7E655D]">
                          Near: <span className="text-[#4E342E] font-semibold">{b.nextStop}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-black font-mono tabular-nums text-[#CC5500] block">
                        {b.etaNextStopMins}m
                      </span>
                      <span className="text-[10px] text-[#7E655D] font-bold">ETA</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Major Kolkata Bus Hubs ─── */}
          <div className="space-y-2 pt-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#4E342E]">
              Key Transit Junctions
            </h2>

            <div className="space-y-1.5">
              {stops.slice(0, 4).map((stop) => (
                <div
                  key={stop.id}
                  className="p-2.5 rounded-xl bg-white/60 border border-[#4E342E]/10 hover:border-[#4E342E]/20 flex items-center justify-between text-xs transition-all shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-3.5 w-3.5 text-[#CC5500] shrink-0" />
                    <div>
                      <span className="font-bold text-[#4E342E]">{stop.name}</span>
                      <span className="text-[10px] text-[#7E655D] ml-1.5 font-normal">({stop.bengaliName})</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {stop.connectingRoutes?.slice(0, 3).map((r) => (
                      <Badge key={r} variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-[#4E342E]/15 text-[#4E342E] bg-white/40">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (7 Cols on Desktop - Wide Interactive Map) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-[#4E342E]/16 bg-white/80 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(78,52,46,0.08)] overflow-hidden">
            <CardHeader className="p-3.5 border-b border-[#4E342E]/8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-[#4E342E] flex items-center gap-2">
                  <MapIcon className="h-4 w-4 text-[#CC5500]" />
                  Spatial Telemetry Map
                </CardTitle>
                <CardDescription className="text-xs text-[#7E655D]">
                  Interactive OpenStreetMap layer with live bus positions and stop nodes
                </CardDescription>
              </div>

              <Badge variant="outline" className="text-[10px] font-mono text-[#4E342E] border-[#4E342E]/20 bg-white/70">
                Lat: 22.57 · Lng: 88.36
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              <BusMap
                buses={liveBuses}
                stops={stops}
                selectedBusId={currentBus.id}
                onSelectBus={(busId) => {
                  const idx = liveBuses.findIndex((b) => b.id === busId);
                  if (idx >= 0) setActiveBusIndex(idx);
                }}
              />
            </CardContent>
          </Card>

          {/* Spatial Architecture Footer Banner */}
          <div className="p-3.5 rounded-2xl bg-white/60 border border-[#4E342E]/14 flex items-center justify-between text-xs shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#CC5500]/12 flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-[#CC5500]" />
              </div>
              <div>
                <span className="font-bold text-[#4E342E] block">PRAVAH Spatial Engine</span>
                <span className="text-[10px] text-[#7E655D]">PostgreSQL + PostGIS telemetry with resilient fallback</span>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] border-[#4E342E]/22 text-[#4E342E] bg-white/70">
              Port 5432
            </Badge>
          </div>
        </div>

      </div>

    </div>
  );
}
