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
    <div className="flex-1 flex flex-col space-y-5">
      {/* ─── Top Header Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-[#4E342E]/12 shadow-[0_4px_20px_-4px_rgba(78,52,46,0.04)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-[#4E342E]">Route Navigator & Planner</h1>
            <Badge variant="outline" className="border-[#CC5500]/30 text-[#CC5500] bg-[#CC5500]/8 text-xs font-semibold">
              {routes.length} Verified Lines
            </Badge>
          </div>
          <p className="text-xs text-[#7E655D] mt-0.5">
            Plan direct corridors and connecting journeys across the Kolkata Metropolitan Region
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4E342E]/6 border border-[#4E342E]/10 text-xs text-[#4E342E] font-medium">
            <Compass className="h-3.5 w-3.5 text-[#CC5500]" />
            <span>Kolkata Urban Mobility</span>
          </div>
        </div>
      </div>

      {/* ─── Responsive Grid (Desktop: 2 Columns / Mobile: Stacked) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (7 cols): Route Planner & List */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Origin ⇄ Destination Card */}
          <Card className="border-[#4E342E]/14 bg-white/80 backdrop-blur-xl shadow-sm">
            <CardHeader className="p-4 pb-2 border-b border-[#4E342E]/8">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-[#4E342E] flex items-center gap-2">
                <Navigation className="h-3.5 w-3.5 text-[#CC5500]" />
                Journey Origin & Destination
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#CC5500] ring-2 ring-[#CC5500]/30" />
                  <div className="w-0.5 h-8 bg-[#4E342E]/18" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#4E342E] ring-2 ring-[#4E342E]/25" />
                </div>

                <div className="flex-1 space-y-2">
                  <div className="relative">
                    <Input
                      value={sourceStop}
                      onChange={(e) => setSourceStop(e.target.value)}
                      placeholder="Origin stop (e.g. Howrah Station)"
                      className="bg-white/90 border-[#4E342E]/18 h-9 text-xs focus-visible:ring-[#CC5500]"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      value={destStop}
                      onChange={(e) => setDestStop(e.target.value)}
                      placeholder="Destination (e.g. Salt Lake Sector V)"
                      className="bg-white/90 border-[#4E342E]/18 h-9 text-xs focus-visible:ring-[#CC5500]"
                    />
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleSwap}
                  className="h-9 w-9 shrink-0 border-[#4E342E]/20 bg-white hover:bg-[#F8F4E7] text-[#4E342E] shadow-sm"
                  title="Swap Origin and Destination"
                >
                  <ArrowUpDown className="h-4 w-4 text-[#4E342E]" />
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
                    className="px-2 py-0.5 rounded-lg bg-[#4E342E]/6 hover:bg-[#CC5500]/12 hover:text-[#CC5500] border border-[#4E342E]/10 text-[10px] font-semibold text-[#4E342E] transition-colors"
                  >
                    {stopName}
                  </button>
                ))}
              </div>

              <Button className="w-full bg-[#CC5500] hover:bg-[#B34A00] text-[#F8F4E7] text-xs font-bold h-9 shadow-[0_4px_14px_0_rgba(204,85,0,0.25)]">
                Find Direct & Connecting Buses
              </Button>
            </CardContent>
          </Card>

          {/* Search bar & Type filter */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7E655D]" />
              <Input
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                placeholder="Filter route number or terminal..."
                className="pl-9 bg-white/80 border-[#4E342E]/18 h-9 text-xs focus-visible:ring-[#CC5500]"
              />
            </div>

            <Tabs value={filterType} onValueChange={setFilterType} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-4 sm:flex w-full sm:w-auto bg-[#4E342E]/8 border border-[#4E342E]/12 h-9">
                <TabsTrigger value="ALL" className="text-xs px-2.5">All</TabsTrigger>
                <TabsTrigger value="AC" className="text-xs px-2.5">AC</TabsTrigger>
                <TabsTrigger value="ORDINARY" className="text-xs px-2.5">Ordinary</TabsTrigger>
                <TabsTrigger value="MINIBUS" className="text-xs px-2.5">Minibus</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Route Listing */}
          <div className="space-y-2.5">
            {filteredRoutes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              return (
                <Card
                  key={route.id}
                  onClick={() => setSelectedRoute(route)}
                  className={`border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#CC5500] bg-[#CC5500]/8 shadow-[0_6px_20px_rgba(204,85,0,0.12)]"
                      : "border-[#4E342E]/12 bg-white/70 hover:border-[#4E342E]/25 hover:bg-white/95 shadow-sm"
                  }`}
                >
                  <CardContent className="p-3.5 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              route.busType === "AC_EXPRESS"
                                ? "ac"
                                : route.busType === "MINIBUS"
                                ? "minibus"
                                : "ordinary"
                            }
                            className="text-xs font-bold"
                          >
                            {route.routeNumber}
                          </Badge>
                          <span className="text-[11px] text-[#7E655D] font-semibold">
                            {route.operator}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-[#4E342E] mt-1">
                          {route.source} ⇄ {route.destination}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-[#4E342E] tabular-nums">
                          ₹{route.fareMin} - ₹{route.fareMax}
                        </span>
                        <span className="text-[10px] text-[#7E655D] block">Est. Fare</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#7E655D] pt-1.5 border-t border-[#4E342E]/10">
                      <div className="flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3 text-[#7E655D]" />
                        <span>Every {route.frequencyMins} mins</span>
                      </div>
                      <div className="flex items-center gap-1 font-medium font-mono tabular-nums">
                        <span>{route.totalStops} Stops</span>
                        <span>·</span>
                        <span>{route.avgTripMins} mins trip</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

        </div>

        {/* Right Column (5 cols): Selected Route Detailed Inspector */}
        <div className="lg:col-span-5 space-y-4">
          {selectedRoute ? (
            <Card className="border-[#4E342E]/16 bg-white/80 backdrop-blur-xl shadow-sm sticky top-20">
              <CardHeader className="p-4 pb-3 border-b border-[#4E342E]/8">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs font-black bg-[#CC5500] text-[#F8F4E7]">
                        {selectedRoute.routeNumber}
                      </Badge>
                      <span className="text-xs font-bold text-[#4E342E]">{selectedRoute.operator}</span>
                    </div>
                    <CardTitle className="text-sm font-bold text-[#4E342E] mt-1.5">
                      {selectedRoute.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-[#7E655D]">
                      {selectedRoute.source} ⇄ {selectedRoute.destination}
                    </CardDescription>
                  </div>

                  <Badge variant="outline" className="text-xs font-mono font-bold text-[#4E342E] border-[#4E342E]/20 bg-white/70">
                    {selectedRoute.distanceKm} km
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                
                {/* Trip Stats */}
                <div className="grid grid-cols-3 gap-2 bg-[#4E342E]/5 p-2.5 rounded-xl border border-[#4E342E]/8 text-center">
                  <div>
                    <span className="text-[10px] text-[#7E655D] uppercase font-bold tracking-wider block">Duration</span>
                    <span className="text-xs font-bold text-[#4E342E] font-mono tabular-nums mt-0.5 block">{selectedRoute.avgTripMins}m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7E655D] uppercase font-bold tracking-wider block">Cadence</span>
                    <span className="text-xs font-bold text-[#CC5500] font-mono tabular-nums mt-0.5 block">Every {selectedRoute.frequencyMins}m</span>
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

                  <div className="space-y-2 pl-3 border-l-2 border-[#CC5500]/40 ml-2 py-1">
                    {selectedRoute.stops.map((stopName, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs group">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#CC5500] -ml-[17px] ring-4 ring-white shadow-sm" />
                        <span className="font-bold text-[#4E342E] group-hover:text-[#CC5500] transition-colors">{stopName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-[#CC5500] hover:bg-[#B34A00] text-[#F8F4E7] text-xs font-bold h-9 shadow-sm">
                  Track Active Buses On This Route
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-[#4E342E]/14 bg-white/60 p-8 text-center text-xs text-[#7E655D]">
              Select a route on the left to inspect stops sequence and schedule.
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
