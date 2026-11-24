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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { KOLKATA_STOPS, KOLKATA_ROUTES, ACTIVE_LIVE_BUSES, LiveBus } from "@/lib/data";
import { useLiveBuses, useStops } from "@/lib/api";
import { useLocationSharing } from "@/lib/useLocationSharing";
import { BUS_STATUS_LABELS, OCCUPANCY_LABELS } from "@/lib/enums";

const BusMap = dynamic(() => import("@/components/BusMap"), {
  ssr: false,
  loading: () => (
    <div className="h-56 rounded-2xl bg-white/50 animate-pulse border border-[#4E342E]/14 flex items-center justify-center text-xs text-[#7E655D] font-medium">
      Loading PRAVAH Interactive Transit Map...
    </div>
  ),
});

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [activeBusIndex, setActiveBusIndex] = React.useState<number>(0);
  const [showMap, setShowMap] = React.useState<boolean>(true);

  // Live data hooks from API with fallback
  const { data: apiBuses } = useLiveBuses(12000);
  const { data: apiStops } = useStops();
  const sharing = useLocationSharing();

  const liveBuses = apiBuses.length > 0 ? apiBuses : ACTIVE_LIVE_BUSES;
  const stops = apiStops.length > 0 ? apiStops : KOLKATA_STOPS;

  const currentBus: LiveBus = liveBuses[activeBusIndex] || liveBuses[0] || ACTIVE_LIVE_BUSES[0];
  const isSharingCurrentBus = sharing.status === "sharing" && sharing.bus?.id === currentBus.id;
  const isSharingOtherBus = sharing.status === "sharing" && !isSharingCurrentBus;

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

  return (
    <div className="flex-1 flex flex-col bg-[#F8F4E7] text-[#4E342E]">
      
      {/* ─── Top Transit Header ─── */}
      <div className="bg-[#F8F4E7]/90 backdrop-blur-xl border-b border-[#4E342E]/12 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-[0_2px_12px_rgba(78,52,46,0.03)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#CC5500]/12 border border-[#CC5500]/30 flex items-center justify-center shadow-sm">
            <Bus className="h-4 w-4 text-[#CC5500]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black tracking-wider text-[#4E342E]">PRAVAH</h1>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-[#CC5500]/35 text-[#CC5500] font-semibold bg-[#CC5500]/8">
                Kolkata
              </Badge>
            </div>
            <p className="text-[11px] text-[#7E655D] font-medium tracking-tight">Real-Time Kolkata Transit Network</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowMap(!showMap)}
            className="h-7 px-2 text-[11px] font-semibold gap-1 border-[#4E342E]/20"
          >
            <MapIcon className="h-3 w-3 text-[#CC5500]" />
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
          <Badge variant="success" className="gap-1 text-[11px] font-semibold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Live
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* ─── Interactive Live Map ─── */}
        {showMap && (
          <BusMap
            buses={liveBuses}
            stops={stops}
            selectedBusId={currentBus.id}
            onSelectBus={(busId) => {
              const idx = liveBuses.findIndex((b) => b.id === busId);
              if (idx >= 0) setActiveBusIndex(idx);
            }}
          />
        )}

        {/* ─── Search & Category Filtering ─── */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7E655D]" />
            <Input
              type="text"
              placeholder="Search route (e.g. S-12, AC-39) or stop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 bg-white/75 border-[#4E342E]/18 h-10 text-sm focus-visible:ring-[#CC5500]"
            />
          </div>

          {/* Quick Filter Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid grid-cols-4 w-full bg-[#4E342E]/8 border border-[#4E342E]/12 h-9">
              <TabsTrigger value="ALL" className="text-[11px]">All</TabsTrigger>
              <TabsTrigger value="AC" className="text-[11px]">AC Express</TabsTrigger>
              <TabsTrigger value="ORDINARY" className="text-[11px]">Ordinary</TabsTrigger>
              <TabsTrigger value="MINIBUS" className="text-[11px]">Minibus</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ─── Featured Live Tracking Card ─── */}
        <Card className="border-[#4E342E]/14 bg-gradient-to-br from-white/90 via-[#F8F4E7]/80 to-white/75 backdrop-blur-xl shadow-[0_12px_36px_-8px_rgba(78,52,46,0.1)]">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs px-2.5 py-0.5 bg-[#CC5500] text-[#F8F4E7] font-bold shadow-sm">
                    {currentBus.busNumber}
                  </Badge>
                  <span className="text-xs text-[#7E655D] font-mono">{currentBus.regNumber}</span>
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
                <span className="text-3xl font-black tracking-tight text-[#CC5500] font-mono block">
                  {currentBus.etaNextStopMins}
                </span>
                <span className="text-[11px] text-[#7E655D] font-semibold">mins ETA</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3.5">
            {/* Live Metrics Row */}
            <div className="grid grid-cols-3 gap-2 bg-[#4E342E]/5 p-2.5 rounded-xl border border-[#4E342E]/10 text-center backdrop-blur-sm">
              <div>
                <div className="flex items-center justify-center gap-1 text-[#7E655D] text-[10px] uppercase font-bold tracking-wider">
                  <Gauge className="h-3 w-3 text-[#7E655D]" /> Speed
                </div>
                <p className="text-xs font-bold text-[#4E342E] mt-0.5">{currentBus.speedKmh} km/h</p>
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
                  <Radio className="h-3 w-3 text-[#7E655D]" /> Source
                </div>
                <p className="text-xs font-bold text-[#4E342E] mt-0.5">
                  {currentBus.crowdsourceContributors} Live Users
                </p>
              </div>
            </div>

            {/* Stop Progression Timeline */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-[#7E655D]">
                <span className="font-medium">Current Corridor</span>
                <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {BUS_STATUS_LABELS[currentBus.status] || "On-Time Status"}
                </span>
              </div>

              <div className="relative pt-2 pb-1">
                <div className="h-1.5 bg-[#4E342E]/12 rounded-full overflow-hidden">
                  <div className="h-full bg-[#CC5500] rounded-full w-2/3 transition-all duration-500 shadow-sm" />
                </div>
                <div className="flex justify-between text-[10px] text-[#7E655D] mt-1 font-medium">
                  <span>Origin</span>
                  <span className="text-[#CC5500] font-bold">{currentBus.nextStop}</span>
                  <span>{currentBus.destination}</span>
                </div>
              </div>
            </div>

            <Separator className="bg-[#4E342E]/12" />

            {/* Real GPS Crowdsourcing Trigger with useLocationSharing hook */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="text-xs text-[#7E655D]">
                <span className="text-[#4E342E] font-bold block">Riding this bus right now?</span>
                <span className="text-[11px] text-[#7E655D]">
                  {isSharingOtherBus
                    ? `Sharing GPS for ${sharing.bus?.busNumber} (${sharing.bus?.regNumber})`
                    : "Share your GPS while on board to help PRAVAH commuters"}
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
                className={`gap-1.5 text-xs font-bold shadow-sm shrink-0 ${
                  !isSharingCurrentBus ? "bg-[#CC5500] text-[#F8F4E7] hover:bg-[#B34A00]" : ""
                }`}
              >
                <Radio className={`h-3.5 w-3.5 ${sharing.status === "locating" ? "animate-spin" : ""}`} />
                {sharing.status === "locating"
                  ? "Locating..."
                  : isSharingCurrentBus
                  ? `Stop (${sharing.sentCount})`
                  : "Share Location"}
              </Button>
            </div>

            {sharing.status === "sharing" && isSharingCurrentBus && (
              <div className="p-2.5 rounded-xl bg-emerald-700/12 border border-emerald-700/25 text-emerald-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                  <span>
                    Broadcasting live GPS fixes (sent {sharing.sentCount}
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

        {/* ─── Active Fleet Switcher ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#4E342E]">
              PRAVAH Live Fleet Tracking ({liveBuses.length})
            </h2>
            <span className="text-[11px] text-[#CC5500] font-semibold">Auto-updating</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {liveBuses.map((b, idx) => {
              const isSelected = activeBusIndex === idx;
              return (
                <div
                  key={b.id}
                  onClick={() => setActiveBusIndex(idx)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#CC5500]/8 border-[#CC5500] shadow-[0_6px_20px_rgba(204,85,0,0.12)]"
                      : "bg-white/65 border-[#4E342E]/12 hover:border-[#4E342E]/25 hover:bg-white/90 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={b.busNumber.startsWith("AC") ? "ac" : "ordinary"}>
                      {b.busNumber}
                    </Badge>
                    <span className="text-xs font-mono font-bold text-[#CC5500]">
                      {b.etaNextStopMins}m
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#4E342E] mt-1.5 truncate">
                    {b.destination}
                  </p>
                  <p className="text-[10px] text-[#7E655D] truncate">
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
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#4E342E]">
              Major Kolkata Bus Hubs Nearby
            </h2>
            <span className="text-[11px] text-[#7E655D]">Metro Corridors</span>
          </div>

          <div className="space-y-2">
            {stops.slice(0, 5).map((stop) => (
              <Card
                key={stop.id}
                className="border-[#4E342E]/12 bg-white/65 hover:bg-white/90 hover:border-[#4E342E]/25 transition-all cursor-pointer shadow-sm"
              >
                <CardContent className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#4E342E]/8 border border-[#4E342E]/14 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-[#CC5500]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-[#4E342E]">{stop.name}</h3>
                        <span className="text-[11px] text-[#7E655D] font-normal">({stop.bengaliName})</span>
                      </div>
                      <p className="text-[11px] text-[#7E655D] mt-0.5">{stop.landmark}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {stop.connectingRoutes?.slice(0, 4).map((r) => (
                          <Badge key={r} variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-[#4E342E]/18 text-[#4E342E] bg-white/50">
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#7E655D] shrink-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ─── Database & Engine Architecture Indicator ─── */}
        <div className="p-3.5 rounded-2xl bg-white/65 border border-[#4E342E]/14 flex items-center justify-between text-xs shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#CC5500]/12 flex items-center justify-center shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-[#CC5500]" />
            </div>
            <div>
              <span className="font-bold text-[#4E342E] block">PRAVAH Transit Engine</span>
              <span className="text-[10px] text-[#7E655D]">PostgreSQL + PostGIS spatial telemetry</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] border-[#4E342E]/22 text-[#4E342E] bg-white/70">
            Port 5432
          </Badge>
        </div>

      </div>
    </div>
  );
}
