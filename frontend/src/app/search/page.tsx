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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KOLKATA_ROUTES, KOLKATA_STOPS, BusRoute } from "@/lib/data";
import { useRoutes } from "@/lib/api";

export default function SearchPage() {
  const { data: apiRoutes } = useRoutes();
  const routes = apiRoutes.length > 0 ? apiRoutes : KOLKATA_ROUTES;

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

  return (
    <div className="flex-1 flex flex-col bg-[#F8F4E7] text-[#4E342E] p-4 space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-[#4E342E] tracking-tight">PRAVAH Route Navigator</h1>
          <p className="text-xs text-[#7E655D]">Real-Time Kolkata Transit Network · Find direct & connecting corridors</p>
        </div>
        <Badge variant="outline" className="border-[#CC5500]/30 text-[#CC5500] bg-[#CC5500]/8 text-xs font-semibold">
          {routes.length} Verified Lines
        </Badge>
      </div>

      {/* ─── Route Planner Card (Origin ⇄ Destination) ─── */}
      <Card className="border-[#4E342E]/14 bg-white/70 backdrop-blur-xl shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-[#CC5500] ring-2 ring-[#CC5500]/30" />
              <div className="w-0.5 h-7 bg-[#4E342E]/18" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#4E342E] ring-2 ring-[#4E342E]/25" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="relative">
                <Input
                  value={sourceStop}
                  onChange={(e) => setSourceStop(e.target.value)}
                  placeholder="From (e.g. Howrah Station)"
                  className="bg-white/80 border-[#4E342E]/18 h-9 text-xs focus-visible:ring-[#CC5500]"
                />
              </div>
              <div className="relative">
                <Input
                  value={destStop}
                  onChange={(e) => setDestStop(e.target.value)}
                  placeholder="To (e.g. Sector V / Airport)"
                  className="bg-white/80 border-[#4E342E]/18 h-9 text-xs focus-visible:ring-[#CC5500]"
                />
              </div>
            </div>

            <Button
              size="icon"
              variant="outline"
              onClick={handleSwap}
              className="h-9 w-9 shrink-0 border-[#4E342E]/20 bg-white/80 hover:bg-[#F8F4E7] text-[#4E342E]"
            >
              <ArrowUpDown className="h-4 w-4 text-[#4E342E]" />
            </Button>
          </div>

          <Button className="w-full bg-[#CC5500] hover:bg-[#B34A00] text-[#F8F4E7] text-xs font-bold h-9 shadow-[0_4px_14px_0_rgba(204,85,0,0.25)]">
            Search Connecting Buses
          </Button>
        </CardContent>
      </Card>

      {/* ─── Search and Filter Tabs ─── */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7E655D]" />
          <Input
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            placeholder="Search by bus route number (e.g. S-12, AC-39)..."
            className="pl-9 bg-white/75 border-[#4E342E]/18 h-9 text-xs focus-visible:ring-[#CC5500]"
          />
        </div>

        <Tabs value={filterType} onValueChange={setFilterType} className="w-full">
          <TabsList className="grid grid-cols-4 w-full bg-[#4E342E]/8 border border-[#4E342E]/12 h-8">
            <TabsTrigger value="ALL" className="text-[11px]">All Types</TabsTrigger>
            <TabsTrigger value="AC" className="text-[11px]">AC Express</TabsTrigger>
            <TabsTrigger value="ORDINARY" className="text-[11px]">Ordinary</TabsTrigger>
            <TabsTrigger value="MINIBUS" className="text-[11px]">Minibus</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ─── Route Listing ─── */}
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
                  : "border-[#4E342E]/12 bg-white/65 hover:border-[#4E342E]/25 hover:bg-white/90 shadow-sm"
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
                    <span className="text-xs font-mono font-bold text-[#4E342E]">
                      ₹{route.fareMin} - ₹{route.fareMax}
                    </span>
                    <span className="text-[10px] text-[#7E655D] block">Est. Fare</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#7E655D] pt-1.5 border-t border-[#4E342E]/10">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#7E655D]" />
                    <span>Every {route.frequencyMins} mins</span>
                  </div>
                  <div className="flex items-center gap-1 font-medium">
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

      {/* ─── Selected Route Detail Drawer ─── */}
      {selectedRoute && (
        <Card className="border-[#4E342E]/15 bg-white/80 shadow-md backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between text-[#4E342E]">
              <span>{selectedRoute.routeNumber} Stops Sequence</span>
              <Badge variant="outline" className="text-[10px] border-[#4E342E]/20 text-[#4E342E]">
                {selectedRoute.distanceKm} km
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-[#7E655D]">
              Complete stopping stations along this transit corridor
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            <div className="space-y-1.5 pl-2 border-l-2 border-[#CC5500]/45 ml-2">
              {selectedRoute.stops.map((stopName, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#CC5500] -ml-[13px] ring-2 ring-white" />
                  <span className="font-semibold text-[#4E342E]">{stopName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
