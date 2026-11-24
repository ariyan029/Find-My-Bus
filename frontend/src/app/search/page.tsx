"use client";

import * as React from "react";
import {
  Compass,
  ArrowUpDown,
  Search,
  MapPin,
  Clock,
  Banknote,
  ArrowRight,
  ShieldCheck,
  Check,
  Navigation,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KOLKATA_ROUTES, KOLKATA_STOPS, BusRoute } from "@/lib/data";
import { useRoutes, useStops } from "@/lib/api";

export default function SearchPage() {
  const { data: apiRoutes } = useRoutes();
  const { data: apiStops } = useStops();

  const routes = apiRoutes.length > 0 ? apiRoutes : KOLKATA_ROUTES;
  const stops = apiStops.length > 0 ? apiStops : KOLKATA_STOPS;

  const [sourceStop, setSourceStop] = React.useState<string>("Howrah Station");
  const [destStop, setDestStop] = React.useState<string>("New Town Shapoorji");
  const [filterType, setFilterType] = React.useState<string>("ALL");
  const [searchWord, setSearchWord] = React.useState<string>("");
  const [selectedRoute, setSelectedRoute] = React.useState<BusRoute | null>(routes[0]);

  React.useEffect(() => {
    if (!selectedRoute && routes.length > 0) {
      setSelectedRoute(routes[0]);
    }
  }, [routes, selectedRoute]);

  const handleSwap = () => {
    const temp = sourceStop;
    setSourceStop(destStop);
    setDestStop(temp);
  };

  const filteredRoutes = React.useMemo(() => {
    return routes.filter((r) => {
      const matchSearch =
        r.routeNumber.toLowerCase().includes(searchWord.toLowerCase()) ||
        r.name.toLowerCase().includes(searchWord.toLowerCase()) ||
        r.source.toLowerCase().includes(searchWord.toLowerCase()) ||
        r.destination.toLowerCase().includes(searchWord.toLowerCase());

      if (!matchSearch) return false;
      if (filterType === "AC") return r.busType === "AC_EXPRESS";
      if (filterType === "ORDINARY") return r.busType === "ORDINARY";
      if (filterType === "MINIBUS") return r.busType === "MINIBUS";
      return true;
    });
  }, [routes, searchWord, filterType]);

  const popularStops = ["Howrah Station", "Esplanade", "Salt Lake Sector V", "Airport Gate 1", "Gariahat"];

  return (
    <div className="flex-1 flex flex-col space-y-6">
      
      {/* ─── Top Header Banner: Frosted Dark Chocolate Glass ─── */}
      <div className="glass-chocolate-hero p-5.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-[#F8F4E7] drop-shadow-xs">
              Route Navigator & Planner
            </h1>
            <span className="bg-[#CC5500] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border border-white/30 shadow-sm">
              {routes.length} Verified Lines
            </span>
          </div>
          <p className="text-xs text-[#F8F4E7]/85 mt-1 max-w-xl leading-relaxed">
            Plan direct corridors, cross-river express lines, and urban junction connections
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/25 backdrop-blur-xl border border-white/20 text-[#F8F4E7] text-xs font-bold shadow-inner">
            <Compass className="h-4 w-4 text-[#CC5500]" />
            <span>Kolkata Transit Network</span>
          </div>
        </div>
      </div>

      {/* ─── Responsive Grid (Desktop: 2 Columns / Mobile: Stacked) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (7 cols): Route Planner & List */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Origin ⇄ Destination Frosted Glass Card */}
          <div className="rounded-2xl overflow-hidden border border-white/60 border-b-[#4E342E]/15 bg-white/55 backdrop-blur-2xl shadow-[0_16px_40px_rgba(78,52,46,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <div className="bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] p-4 border-b border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#F8F4E7] flex items-center gap-2">
                <Navigation className="h-4 w-4 text-[#CC5500]" />
                Journey Origin & Destination
              </span>
              <span className="text-[10px] text-[#F8F4E7]/75 font-mono">Real-Time Routing</span>
            </div>

            <div className="p-5 space-y-4 bg-white/40 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#CC5500] ring-4 ring-[#CC5500]/25 shadow-sm" />
                  <div className="w-0.5 h-10 bg-[#CC5500]/50" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#4E342E] ring-4 ring-[#4E342E]/20 shadow-sm" />
                </div>

                <div className="flex-1 space-y-2.5">
                  <Input
                    value={sourceStop}
                    onChange={(e) => setSourceStop(e.target.value)}
                    placeholder="Origin stop (e.g. Howrah Station)"
                    className="bg-white/60 backdrop-blur-md border border-white/80 h-10.5 text-xs text-[#4E342E] focus-visible:bg-white/85 focus-visible:ring-2 focus-visible:ring-[#CC5500]/30 focus-visible:border-[#CC5500] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] rounded-xl"
                  />
                  <Input
                    value={destStop}
                    onChange={(e) => setDestStop(e.target.value)}
                    placeholder="Destination (e.g. Salt Lake Sector V)"
                    className="bg-white/60 backdrop-blur-md border border-white/80 h-10.5 text-xs text-[#4E342E] focus-visible:bg-white/85 focus-visible:ring-2 focus-visible:ring-[#CC5500]/30 focus-visible:border-[#CC5500] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] rounded-xl"
                  />
                </div>

                <Button
                  size="icon"
                  onClick={handleSwap}
                  className="h-10.5 w-10.5 shrink-0 bg-[#CC5500] hover:bg-[#B34700] text-white border border-white/35 shadow-[0_4px_16px_rgba(204,85,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] rounded-xl transition-transform active:scale-90"
                  title="Swap Origin and Destination"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-[#7E655D] font-bold uppercase tracking-wider mr-1">Quick Select:</span>
                {popularStops.map((stopName) => (
                  <button
                    key={stopName}
                    type="button"
                    onClick={() => {
                      if (!sourceStop) setSourceStop(stopName);
                      else setDestStop(stopName);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/65 hover:bg-[#CC5500] hover:text-white border border-white/85 text-[10px] font-bold text-[#4E342E] transition-all cursor-pointer shadow-xs"
                  >
                    {stopName}
                  </button>
                ))}
              </div>

              <Button className="w-full bg-[#CC5500] hover:bg-[#B34700] text-white text-xs font-bold h-10.5 border border-white/35 shadow-[0_6px_20px_rgba(204,85,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] rounded-xl">
                Find Direct & Connecting Buses
              </Button>
            </div>
          </div>

          {/* Search bar & Type filter (Frosted Glass Input + Dark Chocolate Glass Tabs) */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7E655D]" />
              <Input
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                placeholder="Filter route number or terminal..."
                className="pl-9 bg-white/55 backdrop-blur-xl border border-white/75 border-b-[#4E342E]/15 h-10 text-xs text-[#4E342E] focus-visible:bg-white/85 focus-visible:ring-2 focus-visible:ring-[#CC5500]/30 focus-visible:border-[#CC5500] rounded-xl shadow-[0_4px_16px_rgba(78,52,46,0.04),inset_0_1px_2px_rgba(255,255,255,0.9)]"
              />
            </div>

            <Tabs value={filterType} onValueChange={setFilterType} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-4 sm:flex w-full sm:w-auto bg-[#4E342E]/85 backdrop-blur-2xl border border-white/20 border-t-white/35 h-10 p-1 rounded-xl shadow-[0_8px_24px_rgba(78,52,46,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] text-[#F8F4E7]">
                <TabsTrigger 
                  value="ALL" 
                  className="text-xs px-3 data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-[0_4px_12px_rgba(204,85,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] data-[state=active]:border data-[state=active]:border-white/30 text-[#F8F4E7]/80 hover:text-white"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="AC" 
                  className="text-xs px-3 data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-[0_4px_12px_rgba(204,85,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] data-[state=active]:border data-[state=active]:border-white/30 text-[#F8F4E7]/80 hover:text-white"
                >
                  AC
                </TabsTrigger>
                <TabsTrigger 
                  value="ORDINARY" 
                  className="text-xs px-3 data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-[0_4px_12px_rgba(204,85,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] data-[state=active]:border data-[state=active]:border-white/30 text-[#F8F4E7]/80 hover:text-white"
                >
                  Ordinary
                </TabsTrigger>
                <TabsTrigger 
                  value="MINIBUS" 
                  className="text-xs px-3 data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-[0_4px_12px_rgba(204,85,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] data-[state=active]:border data-[state=active]:border-white/30 text-[#F8F4E7]/80 hover:text-white"
                >
                  Minibus
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Route Listing (Frosted Glass Panels) */}
          <div className="space-y-2.5">
            {filteredRoutes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? "bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] border-[#CC5500] border-l-4 border-l-[#CC5500] shadow-[0_12px_32px_rgba(78,52,46,0.28),inset_0_1px_1px_rgba(255,255,255,0.25)] scale-[1.01]"
                      : "bg-white/50 backdrop-blur-xl hover:bg-white/70 text-[#4E342E] border-white/75 border-b-[#4E342E]/15 hover:border-[#CC5500]/40 shadow-[0_6px_20px_rgba(78,52,46,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-md border ${
                          route.busType === "AC_EXPRESS"
                            ? "bg-[#CC5500] text-white border-white/30 shadow-xs"
                            : route.busType === "MINIBUS"
                            ? "bg-[#B25900] text-white border-white/30 shadow-xs"
                            : isSelected
                            ? "bg-[#CC5500]/35 text-white border-[#CC5500]/50"
                            : "bg-[#4E342E]/12 text-[#4E342E] border-[#4E342E]/15"
                        }`}>
                          {route.routeNumber}
                        </span>
                        <span className={`text-[11px] font-semibold ${isSelected ? "text-[#F8F4E7]/75" : "text-[#7E655D]"}`}>
                          {route.operator}
                        </span>
                      </div>
                      <h3 className={`text-xs font-bold mt-1.5 ${isSelected ? "text-white" : "text-[#4E342E]"}`}>
                        {route.source} ⇄ {route.destination}
                      </h3>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-black text-[#CC5500] tabular-nums block">
                        ₹{route.fareMin} - ₹{route.fareMax}
                      </span>
                      <span className={`text-[10px] block ${isSelected ? "text-[#F8F4E7]/75" : "text-[#7E655D]"}`}>
                        Est. Fare
                      </span>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between text-[11px] pt-2 border-t ${
                    isSelected ? "border-white/18 text-[#F8F4E7]/85" : "border-[#4E342E]/10 text-[#7E655D]"
                  }`}>
                    <div className="flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5 text-[#CC5500]" />
                      <span>Every {route.frequencyMins} mins</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium font-mono tabular-nums">
                      <span>{route.totalStops} Stops</span>
                      <span>·</span>
                      <span>{route.avgTripMins} mins trip</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column (5 cols): Selected Route Detailed Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {selectedRoute ? (
            <div className="rounded-2xl overflow-hidden border border-white/60 border-b-[#4E342E]/15 bg-white/55 backdrop-blur-2xl shadow-[0_16px_40px_rgba(78,52,46,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)] sticky top-20">
              
              {/* Frosted Dark Chocolate Header */}
              <div className="bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] p-4.5 pb-4 border-b border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-[#CC5500] text-white px-2.5 py-0.5 rounded-lg shadow-sm border border-white/30">
                        {selectedRoute.routeNumber}
                      </span>
                      <span className="text-xs font-bold text-[#F8F4E7]/90">{selectedRoute.operator}</span>
                    </div>
                    <h3 className="text-sm font-black text-[#F8F4E7] mt-2">
                      {selectedRoute.name}
                    </h3>
                    <p className="text-xs text-[#F8F4E7]/80 mt-0.5">
                      {selectedRoute.source} ⇄ {selectedRoute.destination}
                    </p>
                  </div>

                  <span className="text-xs font-mono font-bold text-white bg-[#CC5500]/30 border border-white/30 px-2.5 py-1 rounded-lg shadow-xs">
                    {selectedRoute.distanceKm} km
                  </span>
                </div>
              </div>

              {/* Frosted Translucent Glass Body */}
              <div className="p-5 space-y-4 bg-white/45 backdrop-blur-xl">
                
                {/* Trip Stats */}
                <div className="grid grid-cols-3 gap-2 bg-white/60 backdrop-blur-md p-3 rounded-xl border border-white/85 text-center shadow-xs">
                  <div>
                    <span className="text-[10px] text-[#7E655D] uppercase font-bold tracking-wider block">Duration</span>
                    <span className="text-xs font-bold text-[#4E342E] font-mono tabular-nums mt-0.5 block">{selectedRoute.avgTripMins}m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7E655D] uppercase font-bold tracking-wider block">Cadence</span>
                    <span className="text-xs font-black text-[#CC5500] font-mono tabular-nums mt-0.5 block">Every {selectedRoute.frequencyMins}m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7E655D] uppercase font-bold tracking-wider block">Fare Band</span>
                    <span className="text-xs font-bold text-[#4E342E] font-mono tabular-nums mt-0.5 block">₹{selectedRoute.fareMin}-{selectedRoute.fareMax}</span>
                  </div>
                </div>

                {/* Stop by Stop Vertical Timeline */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#4E342E]">
                    Sequential Station Stops ({selectedRoute.stops.length})
                  </h4>

                  <div className="space-y-2.5 pl-3 border-l-2 border-[#CC5500] ml-2 py-1">
                    {selectedRoute.stops.map((stopName, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs group">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#CC5500] -ml-[17px] ring-4 ring-white/90 shadow-sm" />
                        <span className="font-bold text-[#4E342E] group-hover:text-[#CC5500] transition-colors">{stopName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-[#CC5500] hover:bg-[#B34700] text-white text-xs font-bold h-10.5 border border-white/35 shadow-[0_6px_20px_rgba(204,85,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] rounded-xl">
                  Track Active Buses On This Route
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/70 bg-white/45 backdrop-blur-xl p-8 text-center text-xs text-[#7E655D] shadow-sm">
              Select a route on the left to inspect stops sequence and schedule.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
