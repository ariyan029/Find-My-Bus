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

export default function SearchPage() {
  const [sourceStop, setSourceStop] = React.useState<string>("Howrah Station");
  const [destStop, setDestStop] = React.useState<string>("New Town Shapoorji");
  const [filterType, setFilterType] = React.useState<string>("ALL");
  const [searchWord, setSearchWord] = React.useState<string>("");
  const [selectedRoute, setSelectedRoute] = React.useState<BusRoute | null>(KOLKATA_ROUTES[0]);

  const handleSwap = () => {
    const temp = sourceStop;
    setSourceStop(destStop);
    setDestStop(temp);
  };

  const filteredRoutes = React.useMemo(() => {
    return KOLKATA_ROUTES.filter((r) => {
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
  }, [searchWord, filterType]);

  return (
    <div className="flex-1 flex flex-col bg-[#09090b] text-zinc-100 p-4 space-y-4">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Kolkata Route Navigator</h1>
          <p className="text-xs text-zinc-400">Find direct and connecting buses across Kolkata</p>
        </div>
        <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-xs">
          {KOLKATA_ROUTES.length} Official Routes
        </Badge>
      </div>

      {/* ─── Route Planner Card (Origin ⇄ Destination) ─── */}
      <Card className="border-[#272732] bg-[#121217]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/30" />
              <div className="w-0.5 h-7 bg-[#272732]" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="relative">
                <Input
                  value={sourceStop}
                  onChange={(e) => setSourceStop(e.target.value)}
                  placeholder="From (e.g. Howrah Station)"
                  className="bg-[#181822] border-[#272732] h-9 text-xs"
                />
              </div>
              <div className="relative">
                <Input
                  value={destStop}
                  onChange={(e) => setDestStop(e.target.value)}
                  placeholder="To (e.g. Sector V / Airport)"
                  className="bg-[#181822] border-[#272732] h-9 text-xs"
                />
              </div>
            </div>

            <Button
              size="icon"
              variant="outline"
              onClick={handleSwap}
              className="h-9 w-9 shrink-0 border-[#272732] bg-[#181822]"
            >
              <ArrowUpDown className="h-4 w-4 text-zinc-300" />
            </Button>
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-500 text-xs font-semibold h-9">
            Search Connecting Buses
          </Button>
        </CardContent>
      </Card>

      {/* ─── Search and Filter Tabs ─── */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <Input
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            placeholder="Search by bus route number (e.g. S-12, AC-39)..."
            className="pl-9 bg-[#121217] border-[#272732] h-9 text-xs"
          />
        </div>

        <Tabs value={filterType} onValueChange={setFilterType} className="w-full">
          <TabsList className="grid grid-cols-4 w-full bg-[#121217] border border-[#272732] h-8">
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
                  ? "border-blue-500/60 bg-[#161622] shadow-sm"
                  : "border-[#272732] bg-[#121217] hover:border-[#383848]"
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
                      <span className="text-[11px] text-zinc-400 font-medium">
                        {route.operator}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-white mt-1">
                      {route.source} ⇄ {route.destination}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-white">
                      ₹{route.fareMin} - ₹{route.fareMax}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">Est. Fare</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-[#272732]/60">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-zinc-500" />
                    <span>Every {route.frequencyMins} mins</span>
                  </div>
                  <div className="flex items-center gap-1">
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
        <Card className="border-[#272732] bg-[#15151f]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>{selectedRoute.routeNumber} Stops Sequence</span>
              <Badge variant="outline" className="text-[10px]">
                {selectedRoute.distanceKm} km
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Complete stopping stations along this transit corridor
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            <div className="space-y-1.5 pl-2 border-l-2 border-blue-500/40 ml-2">
              {selectedRoute.stops.map((stopName, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-400 -ml-[13px]" />
                  <span className="font-medium text-white">{stopName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
