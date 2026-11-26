"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bus,
  MapPin,
  Search,
  Radio,
  CheckCircle2,
  AlertCircle,
  Users,
  Gauge,
  Sparkles,
  Map as MapIcon,
  RefreshCw,
  Cpu,
  Bookmark,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { KOLKATA_STOPS, KOLKATA_ROUTES, ACTIVE_LIVE_BUSES } from "@/lib/data";
import { useLiveBuses, useRoutes, useStops } from "@/lib/api";
import { useLocationSharing } from "@/lib/useLocationSharing";
import { useSavedTransit } from "@/lib/useSavedTransit";
import { haversineKm } from "@/lib/transit";
import { BUS_STATUS_LABELS, OCCUPANCY_LABELS, TELEMETRY_SOURCE_LABELS } from "@/lib/enums";

const BusMap = dynamic(() => import("@/components/BusMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[380px] lg:h-[560px] w-full rounded-2xl bg-white/40 backdrop-blur-2xl border border-white/70 flex flex-col items-center justify-center gap-3 p-6 text-[#7E655D] shadow-[0_8px_32px_rgba(78,52,46,0.08)]">
      <div className="w-10 h-10 rounded-xl bg-[#CC5500]/15 border border-[#CC5500]/30 flex items-center justify-center animate-spin">
        <RefreshCw className="h-5 w-5 text-[#CC5500]" />
      </div>
      <p className="text-xs font-bold text-[#4E342E]">Loading PRAVAH Spatial Map...</p>
    </div>
  ),
});

function formatUpdatedAgo(secs: number): string {
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m ago` : `${hrs}h ago`;
}

function LiveRadarContent({
  routeParam,
  busParam,
  fromParam,
  toParam,
}: {
  routeParam: string;
  busParam: string;
  fromParam: string;
  toParam: string;
}) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>(routeParam);
  const [selectedBusId, setSelectedBusId] = React.useState<string>(busParam || ACTIVE_LIVE_BUSES[0].id);
  const [boardedRouteNumber, setBoardedRouteNumber] = React.useState<string>(routeParam);
  const [boardedToStop, setBoardedToStop] = React.useState<string>(toParam);
  const [fitRouteTrigger, setFitRouteTrigger] = React.useState<number>(() =>
    routeParam || toParam ? 1 : 0
  );

  const { data: apiBuses, storageMode } = useLiveBuses(8000);
  const { data: apiRoutes } = useRoutes();
  const { data: apiStops } = useStops();
  const sharing = useLocationSharing({ mode: "commuter" });
  const { savedStopIds, toggleSavedStop } = useSavedTransit();

  const liveBuses = apiBuses.length > 0 ? apiBuses : ACTIVE_LIVE_BUSES;
  const routes = apiRoutes.length > 0 ? apiRoutes : KOLKATA_ROUTES;
  const stops = apiStops.length > 0 ? apiStops : KOLKATA_STOPS;

  const routeTypeByNumber = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const r of routes) {
      map.set(r.routeNumber.toLowerCase(), r.busType);
    }
    return map;
  }, [routes]);

  const filteredBuses = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return liveBuses.filter((b) => {
      const matchSearch =
        !q ||
        b.busNumber.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q) ||
        b.nextStop.toLowerCase().includes(q) ||
        b.regNumber.toLowerCase().includes(q);

      if (!matchSearch) return false;
      const busType = routeTypeByNumber.get(b.busNumber.toLowerCase());
      if (selectedCategory === "AC") {
        return busType
          ? busType === "AC_EXPRESS" || busType === "ELECTRIC"
          : b.busNumber.startsWith("AC") || b.busNumber.startsWith("S-12");
      }
      if (selectedCategory === "ORDINARY") {
        return busType ? busType === "ORDINARY" : !b.busNumber.startsWith("AC") && !b.busNumber.includes("B");
      }
      if (selectedCategory === "MINIBUS") {
        return busType ? busType === "MINIBUS" : b.busNumber.includes("B");
      }
      return true;
    });
  }, [liveBuses, searchQuery, selectedCategory, routeTypeByNumber]);

  const currentBus = React.useMemo(() => {
    return (
      filteredBuses.find((b) => b.id === selectedBusId) ||
      filteredBuses[0] ||
      liveBuses.find((b) => b.id === selectedBusId) ||
      liveBuses[0] ||
      ACTIVE_LIVE_BUSES[0]
    );
  }, [liveBuses, filteredBuses, selectedBusId]);

  // Active route shown on map: explicit passenger-selected route, or the selected bus's route.
  const activeRoute = React.useMemo(() => {
    const targetRouteNum = boardedRouteNumber || currentBus?.busNumber;
    if (targetRouteNum) {
      const match = routes.find(
        (r) => r.routeNumber.toLowerCase() === targetRouteNum.toLowerCase()
      );
      if (match) return match;
    }
    return routes.find((r) => r.id === currentBus?.routeId) || routes[0] || null;
  }, [boardedRouteNumber, currentBus, routes]);

  // Nearest stop on the active route to the passenger's live GPS (when GPS is on).
  const nearestGpsStop = React.useMemo(() => {
    if (!sharing.lastCoords || !activeRoute?.stopPoints?.length) return null;
    let bestName: string | null = null;
    let bestDist = Infinity;
    for (const pt of activeRoute.stopPoints) {
      const d = haversineKm(sharing.lastCoords.lat, sharing.lastCoords.lng, pt.lat, pt.lng);
      if (d < bestDist) {
        bestDist = d;
        bestName = pt.name;
      }
    }
    return bestName;
  }, [sharing.lastCoords, activeRoute]);

  const effectiveFromStop = fromParam || nearestGpsStop || null;
  const effectiveToStop = boardedToStop || activeRoute?.destination || null;

  const targetBusForSharing = React.useMemo(() => {
    if (!activeRoute) return currentBus;
    const liveOnRoute = liveBuses.find(
      (b) => b.busNumber.toLowerCase() === activeRoute.routeNumber.toLowerCase()
    );
    if (liveOnRoute) return liveOnRoute;
    const firstPt = activeRoute.stopPoints?.[0];
    return {
      ...currentBus,
      id: `bus-${activeRoute.routeNumber.toLowerCase().replace(/[^a-z0-9]+/g, "")}-01`,
      busNumber: activeRoute.routeNumber,
      routeId: activeRoute.id,
      regNumber: "WB-BOARDED",
      currentLat: firstPt?.lat ?? currentBus.currentLat,
      currentLng: firstPt?.lng ?? currentBus.currentLng,
      originStop: activeRoute.source,
      destination: activeRoute.destination,
    };
  }, [activeRoute, currentBus, liveBuses]);

  const passengerCoords = React.useMemo(
    () =>
      sharing.lastCoords
        ? {
            lat: sharing.lastCoords.lat,
            lng: sharing.lastCoords.lng,
            accuracyMeters: sharing.accuracyMeters,
          }
        : null,
    [sharing.lastCoords, sharing.accuracyMeters]
  );

  const isSharingCurrentBus =
    (sharing.status === "sharing" || sharing.status === "locating") &&
    sharing.bus?.busNumber.toLowerCase() === (activeRoute?.routeNumber || currentBus?.busNumber).toLowerCase();
  const isSharingOtherBus =
    (sharing.status === "sharing" || sharing.status === "locating") &&
    !isSharingCurrentBus;
  const mapBuses = filteredBuses.length > 0 ? filteredBuses : liveBuses;

  const handleSelectBus = React.useCallback((busId: string) => {
    setSelectedBusId(busId);
    setBoardedRouteNumber("");
  }, []);

  const majorHubs = React.useMemo(() => {
    const priorityIds = new Set([
      "stop-howrah",
      "stop-esplanade",
      "stop-sealdah",
      "stop-sector5",
      "stop-barasat",
      "stop-airport",
    ]);
    const matched = stops.filter((s) => priorityIds.has(s.id));
    return matched.length > 0 ? matched : stops.slice(0, 6);
  }, [stops]);

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* ─── Top Dashboard Banner ─── */}
      <div className="glass-chocolate-hero p-5.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-black tracking-tight text-[#F8F4E7] drop-shadow-xs">
              Live Transit Radar
            </h1>
            <span className="bg-[#CC5500] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border border-white/30 shadow-sm">
              Kolkata Real-Time
            </span>
          </div>
          <p className="text-xs text-[#F8F4E7]/85 mt-1 max-w-xl leading-relaxed">
            Live telemetry from onboard ESP32 GPS trackers, driver phones, and commuter crowdsourcing
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/25 backdrop-blur-xl border border-white/20 text-[#F8F4E7] text-xs font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
            <Radio className="h-4 w-4 text-[#CC5500] animate-pulse" />
            <span>
              <strong className="text-white font-mono text-sm">{liveBuses.length}</strong> Active Buses
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-[#F8F4E7] text-xs font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                storageMode === "postgres"
                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                  : "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
              }`}
            />
            <span>{storageMode === "postgres" ? "PostGIS Live" : "In-Memory Live"}</span>
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
            className="pl-9 pr-4 bg-white/55 backdrop-blur-xl border border-white/75 border-b-[#4E342E]/15 h-11 text-xs text-[#4E342E] placeholder:text-[#7E655D] focus-visible:bg-white/85 focus-visible:ring-2 focus-visible:ring-[#CC5500]/30 focus-visible:border-[#CC5500] shadow-[0_4px_16px_rgba(78,52,46,0.05),inset_0_1px_2px_rgba(255,255,255,0.9)] rounded-xl"
          />
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-4 md:flex w-full md:w-auto bg-[#4E342E]/85 backdrop-blur-2xl border border-white/20 border-t-white/35 h-10.5 p-1 rounded-xl shadow-[0_8px_24px_rgba(78,52,46,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] text-[#F8F4E7]">
            <TabsTrigger
              value="ALL"
              className="text-xs px-3.5 py-1.5 data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-[0_4px_12px_rgba(204,85,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] data-[state=active]:border data-[state=active]:border-white/30 text-[#F8F4E7]/80 hover:text-white"
            >
              All Lines
            </TabsTrigger>
            <TabsTrigger
              value="AC"
              className="text-xs px-3.5 py-1.5 data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-[0_4px_12px_rgba(204,85,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] data-[state=active]:border data-[state=active]:border-white/30 text-[#F8F4E7]/80 hover:text-white"
            >
              AC Express
            </TabsTrigger>
            <TabsTrigger
              value="ORDINARY"
              className="text-xs px-3.5 py-1.5 data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-[0_4px_12px_rgba(204,85,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] data-[state=active]:border data-[state=active]:border-white/30 text-[#F8F4E7]/80 hover:text-white"
            >
              Ordinary
            </TabsTrigger>
            <TabsTrigger
              value="MINIBUS"
              className="text-xs px-3.5 py-1.5 data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-[0_4px_12px_rgba(204,85,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] data-[state=active]:border data-[state=active]:border-white/30 text-[#F8F4E7]/80 hover:text-white"
            >
              Minibus
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ─── Responsive Split Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selected Active Bus Hero Card */}
          <div className="rounded-2xl overflow-hidden border border-white/60 border-b-[#4E342E]/15 shadow-[0_16px_40px_rgba(78,52,46,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <div className="bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] p-5 border-b border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#CC5500] text-white text-xs font-black px-2.5 py-0.5 rounded-lg shadow-sm border border-white/30 tracking-wide">
                      {currentBus.busNumber}
                    </span>
                    <span className="text-xs text-[#F8F4E7]/75 font-mono tracking-tight">
                      {currentBus.regNumber}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/15 border border-white/20 text-[#F8F4E7]">
                      {currentBus.telemetrySource === "ESP_IOT" ? (
                        <Cpu className="h-3 w-3 text-[#CC5500]" />
                      ) : currentBus.telemetrySource === "DRIVER_APP" ? (
                        <Navigation className="h-3 w-3 text-[#CC5500]" />
                      ) : (
                        <Radio className="h-3 w-3 text-[#CC5500]" />
                      )}
                      {TELEMETRY_SOURCE_LABELS[currentBus.telemetrySource]}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[#F8F4E7] mt-2">
                    Toward {currentBus.destination}
                  </h3>
                  <p className="text-xs text-[#F8F4E7]/85 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-[#CC5500] shrink-0" />
                    Approaching: <span className="text-white font-bold">{currentBus.nextStop}</span>
                    {currentBus.distanceToNextStopKm != null && (
                      <span className="text-[#F8F4E7]/70 font-mono text-[11px]">
                        ({currentBus.distanceToNextStopKm} km)
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-3xl font-black tracking-tight text-[#CC5500] font-mono tabular-nums block drop-shadow-sm">
                    {currentBus.etaNextStopMins}
                  </span>
                  <span className="text-[10px] text-[#F8F4E7]/75 font-bold uppercase tracking-widest">
                    mins ETA
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/55 backdrop-blur-2xl p-5 space-y-4">
              {/* Telemetry Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 bg-white/65 backdrop-blur-md p-2.5 rounded-xl border border-white/85 text-center shadow-xs">
                <div>
                  <div className="flex items-center justify-center gap-1 text-[#7E655D] text-[10px] uppercase font-bold tracking-wider">
                    <Gauge className="h-3 w-3 text-[#CC5500]" /> Speed
                  </div>
                  <p className="text-xs font-bold text-[#4E342E] mt-0.5 font-mono tabular-nums">
                    {currentBus.speedKmh} km/h
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1 text-[#7E655D] text-[10px] uppercase font-bold tracking-wider">
                    <Users className="h-3 w-3 text-[#CC5500]" /> Crowd
                  </div>
                  <p className="text-xs font-bold text-[#CC5500] mt-0.5">
                    {OCCUPANCY_LABELS[currentBus.occupancy] || "Seats Available"}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1 text-[#7E655D] text-[10px] uppercase font-bold tracking-wider">
                    <Radio className="h-3 w-3 text-[#CC5500]" /> Updated
                  </div>
                  <p
                    suppressHydrationWarning
                    className="text-xs font-bold text-[#4E342E] mt-0.5 font-mono tabular-nums"
                  >
                    {formatUpdatedAgo(currentBus.lastUpdatedSecsAgo)}
                  </p>
                </div>
              </div>

              {/* Corridor Timeline */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#7E655D]">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-[#4E342E]">
                    Corridor Progress ({currentBus.progressPct}%)
                  </span>
                  <span className="text-[11px] text-[#CC5500] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#CC5500] animate-ping" />
                    {BUS_STATUS_LABELS[currentBus.status] || "On-Time"}
                  </span>
                </div>

                <div className="relative pt-1 pb-1">
                  <div className="h-2 bg-[#4E342E]/10 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-[#CC5500] rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${currentBus.progressPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between gap-2 text-[10px] text-[#7E655D] mt-1 font-bold">
                    <span className="truncate">{currentBus.originStop}</span>
                    <span className="text-[#CC5500] font-black truncate">{currentBus.nextStop}</span>
                    <span className="truncate text-right">{currentBus.destination}</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-[#4E342E]/10" />

              {/* Real GPS Crowdsourcing + Passenger Route Path Trigger */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#4E342E] block">
                      Route You Boarded
                    </label>
                    <select
                      value={activeRoute?.routeNumber || currentBus.busNumber}
                      onChange={(e) => {
                        const nextRoute = e.target.value;
                        setBoardedRouteNumber(nextRoute);
                        setBoardedToStop("");
                        setSearchQuery(nextRoute);
                        const matchingBus = liveBuses.find(
                          (b) => b.busNumber.toLowerCase() === nextRoute.toLowerCase()
                        );
                        if (matchingBus) setSelectedBusId(matchingBus.id);
                        setFitRouteTrigger((n) => n + 1);
                      }}
                      className="w-full h-9 px-2.5 rounded-xl bg-white/80 border border-[#4E342E]/15 text-xs font-bold text-[#4E342E] focus:outline-none focus:ring-2 focus:ring-[#CC5500]"
                    >
                      {routes.map((r) => (
                        <option key={r.id} value={r.routeNumber}>
                          {r.routeNumber} · {r.source} ⇄ {r.destination}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#4E342E] block">
                      Where Are You Going?
                    </label>
                    <select
                      value={effectiveToStop || ""}
                      onChange={(e) => {
                        setBoardedToStop(e.target.value);
                        setFitRouteTrigger((n) => n + 1);
                      }}
                      className="w-full h-9 px-2.5 rounded-xl bg-white/80 border border-[#4E342E]/15 text-xs font-bold text-[#4E342E] focus:outline-none focus:ring-2 focus:ring-[#CC5500]"
                    >
                      {(activeRoute?.stopPoints ?? []).map((sp) => (
                        <option key={`${sp.stopId}-${sp.sequence}`} value={sp.name}>
                          {sp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-[#7E655D] leading-tight">
                    <span className="text-[#4E342E] font-bold block">On board this bus?</span>
                    <span className="text-[11px] text-[#7E655D]">
                      {isSharingOtherBus
                        ? `Sharing for ${sharing.bus?.busNumber} (${sharing.bus?.regNumber})`
                        : "Turn on GPS to track your live route to destination"}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={isSharingCurrentBus ? "destructive" : "default"}
                    onClick={() => {
                      if (isSharingCurrentBus) {
                        sharing.stop();
                      } else {
                        setFitRouteTrigger((n) => n + 1);
                        sharing.start(targetBusForSharing);
                      }
                    }}
                    disabled={isSharingOtherBus}
                    className={`gap-1.5 text-xs font-bold shrink-0 rounded-xl ${
                      !isSharingCurrentBus
                        ? "bg-[#CC5500] hover:bg-[#B34700] text-white border border-white/30 shadow-[0_6px_20px_rgba(204,85,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                        : ""
                    }`}
                  >
                    <Radio className={`h-3.5 w-3.5 ${sharing.status === "locating" ? "animate-spin" : ""}`} />
                    {sharing.status === "locating"
                      ? "Acquiring GPS..."
                      : isSharingCurrentBus
                        ? `Stop GPS (${sharing.sentCount})`
                        : "Turn On GPS & Show Route"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] bg-[#4E342E]/6 px-3 py-2 rounded-xl border border-[#4E342E]/10">
                <span className="text-[#7E655D]">
                  Driving this bus or testing an ESP32 tracker?
                </span>
                <Link href="/driver" className="font-bold text-[#CC5500] hover:underline shrink-0 ml-2">
                  Driver / IoT Mode →
                </Link>
              </div>

              {sharing.status === "sharing" && isSharingCurrentBus && (
                <div className="p-2.5 rounded-xl bg-blue-600/12 border border-blue-600/30 text-[#4E342E] text-xs flex items-center justify-between font-medium shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                    <span>
                      GPS active on <strong>{activeRoute?.routeNumber}</strong>
                      {effectiveFromStop ? ` from ${effectiveFromStop}` : ""}
                      {effectiveToStop ? ` → ${effectiveToStop}` : ""}
                      {sharing.accuracyMeters != null ? ` (±${Math.round(sharing.accuracyMeters)}m)` : ""}
                    </span>
                  </div>
                </div>
              )}

              {(sharing.error || sharing.warning) && (
                <div className="p-2.5 rounded-xl bg-red-700/12 border border-red-700/25 text-red-900 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
                  <span>{sharing.error || sharing.warning}</span>
                </div>
              )}
            </div>
          </div>

          {/* Active Fleet Cards List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#4E342E]">
                Active Fleet Units ({filteredBuses.length})
              </h2>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[11px] text-[#CC5500] font-bold hover:underline cursor-pointer"
                >
                  Clear Filter
                </button>
              )}
            </div>

            {filteredBuses.length === 0 ? (
              <div className="p-5 rounded-xl bg-white/50 border border-white/75 text-center text-xs text-[#7E655D]">
                No active buses match &ldquo;{searchQuery}&rdquo;. Try clearing the filter or launch a Driver/ESP32 broadcast.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                {filteredBuses.map((b) => {
                  const isSelected = currentBus.id === b.id;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBusId(b.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] border-[#CC5500] border-l-4 border-l-[#CC5500] shadow-[0_12px_32px_rgba(78,52,46,0.28),inset_0_1px_1px_rgba(255,255,255,0.25)] scale-[1.01]"
                          : "bg-white/50 backdrop-blur-xl hover:bg-white/70 text-[#4E342E] border-white/75 border-b-[#4E342E]/15 hover:border-[#CC5500]/40 shadow-[0_6px_20px_rgba(78,52,46,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? "bg-[#CC5500] text-white border-white/30 shadow-[0_2px_10px_rgba(204,85,0,0.4)]"
                              : "bg-white/60 text-[#CC5500] border-white/80 shadow-xs"
                          }`}
                        >
                          <Bus className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-black ${isSelected ? "text-white" : "text-[#4E342E]"}`}>
                              {b.busNumber}
                            </span>
                            <span className={`text-[10px] font-mono ${isSelected ? "text-[#F8F4E7]/75" : "text-[#7E655D]"}`}>
                              {b.regNumber}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                isSelected
                                  ? "bg-white/15 text-[#F8F4E7]"
                                  : "bg-[#4E342E]/8 text-[#7E655D]"
                              }`}
                            >
                              {TELEMETRY_SOURCE_LABELS[b.telemetrySource]}
                            </span>
                          </div>
                          <p
                            className={`text-xs font-medium truncate mt-0.5 ${
                              isSelected ? "text-[#F8F4E7]/90" : "text-[#4E342E]"
                            }`}
                          >
                            Toward {b.destination}
                          </p>
                          <p className={`text-[10px] truncate ${isSelected ? "text-[#F8F4E7]/75" : "text-[#7E655D]"}`}>
                            Near: <span className={`font-semibold ${isSelected ? "text-white" : "text-[#4E342E]"}`}>{b.nextStop}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className="text-base font-black font-mono tabular-nums text-[#CC5500] block">
                          {b.etaNextStopMins}m
                        </span>
                        <span className={`text-[10px] font-bold ${isSelected ? "text-[#F8F4E7]/75" : "text-[#7E655D]"}`}>
                          ETA
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Major Kolkata Bus Hubs */}
          <div className="space-y-2 pt-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#4E342E]">
              Key Transit Junctions
            </h2>

            <div className="space-y-2">
              {majorHubs.map((stop) => {
                const isSaved = savedStopIds.includes(stop.id);
                return (
                  <div
                    key={stop.id}
                    className="p-3 rounded-xl bg-white/45 backdrop-blur-xl border border-white/75 hover:bg-white/65 hover:border-[#CC5500]/40 flex items-center justify-between text-xs transition-all shadow-[0_4px_16px_rgba(78,52,46,0.04),inset_0_1px_1px_rgba(255,255,255,0.8)] gap-2"
                  >
                    <Link
                      href={`/search?from=${encodeURIComponent(stop.name)}`}
                      className="flex items-center gap-2.5 min-w-0 flex-1"
                    >
                      <MapPin className="h-3.5 w-3.5 text-[#CC5500] shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-[#4E342E]">{stop.name}</span>
                        <span className="text-[10px] text-[#7E655D] ml-1.5 font-normal">
                          ({stop.bengaliName})
                        </span>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      {stop.connectingRoutes?.slice(0, 2).map((r) => (
                        <span
                          key={r}
                          className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-[#4E342E]/10 text-[#4E342E] border border-white/60 shadow-xs"
                        >
                          {r}
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => toggleSavedStop(stop.id)}
                        title={isSaved ? "Remove from Saved Hubs" : "Save Stop"}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isSaved ? "text-[#CC5500]" : "text-[#7E655D] hover:text-[#4E342E]"
                        }`}
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${isSaved ? "fill-[#CC5500]" : ""}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols - Interactive Map) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-white/60 bg-white/40 backdrop-blur-2xl shadow-[0_16px_40px_rgba(78,52,46,0.12),inset_0_1px_1px_rgba(255,255,255,0.85)] overflow-hidden">
            <div className="p-4 bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] border-b border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-row items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#F8F4E7] flex items-center gap-2">
                  <MapIcon className="h-4 w-4 text-[#CC5500]" />
                  Spatial Telemetry Map
                </h3>
                <p className="text-xs text-[#F8F4E7]/75">
                  Auto-refreshing every 8s · Tap any bus marker to track
                </p>
              </div>

              <span className="text-[10px] font-mono font-bold text-[#F8F4E7] bg-[#CC5500]/30 border border-white/30 px-2.5 py-1 rounded-md shadow-xs">
                Kolkata Grid
              </span>
            </div>

            <div className="p-0">
              <BusMap
                buses={mapBuses}
                stops={stops}
                selectedBusId={currentBus.id}
                onSelectBus={handleSelectBus}
                activeRoute={activeRoute}
                boardedFromStop={effectiveFromStop}
                boardedToStop={effectiveToStop}
                passengerCoords={passengerCoords}
                fitRouteTrigger={fitRouteTrigger}
              />
            </div>
          </div>

          {/* Spatial Architecture Footer Banner */}
          <div className="p-4 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/80 flex items-center justify-between text-xs shadow-[0_8px_24px_rgba(78,52,46,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#CC5500] text-white flex items-center justify-center shrink-0 border border-white/40 shadow-[0_2px_8px_rgba(204,85,0,0.35)]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-[#4E342E] block">PRAVAH Multi-Source Telemetry</span>
                <span className="text-[10px] text-[#7E655D]">
                  ESP32 IoT + Driver GPS + Rider Crowdsourcing with PostGIS & live memory fallback
                </span>
              </div>
            </div>
            <Link
              href="/driver"
              className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border border-white/70 text-[#CC5500] bg-white/75 hover:bg-[#CC5500] hover:text-white transition-colors shadow-xs shrink-0"
            >
              Open Console
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function HomePageInner() {
  const searchParams = useSearchParams();
  const routeParam = searchParams.get("route") ?? "";
  const busParam = searchParams.get("bus") ?? "";
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  return (
    <LiveRadarContent
      key={`${routeParam}:${busParam}:${fromParam}:${toParam}`}
      routeParam={routeParam}
      busParam={busParam}
      fromParam={fromParam}
      toParam={toParam}
    />
  );
}

export default function HomePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-xs font-bold text-[#4E342E]">
          Loading Live Transit Radar...
        </div>
      }
    >
      <HomePageInner />
    </React.Suspense>
  );
}
