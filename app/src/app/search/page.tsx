"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Compass,
  ArrowUpDown,
  Search,
  Clock,
  ArrowRight,
  Navigation,
  Bookmark,
  Bus,
  Repeat,
  Radio,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ACTIVE_LIVE_BUSES, KOLKATA_ROUTES, KOLKATA_STOPS, BusRoute, BusStop } from "@/lib/data";
import { useLiveBuses, useRoutes, useStops } from "@/lib/api";
import {
  findJourneys,
  JourneySearchResult,
  PlacePoint,
  resolveLocalPlace,
} from "@/lib/transit";
import { useSavedTransit } from "@/lib/useSavedTransit";

type TimePreset = "now" | "morning" | "afternoon" | "evening";

function resolvePresetDate(preset: TimePreset): Date {
  const d = new Date();
  if (preset === "morning") {
    d.setHours(9, 0, 0, 0);
  } else if (preset === "afternoon") {
    d.setHours(13, 30, 0, 0);
  } else if (preset === "evening") {
    d.setHours(18, 0, 0, 0);
  }
  return d;
}

function StopAutocompleteInput({
  value,
  onChange,
  stops,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  stops: BusStop[];
  placeholder: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const indexedStops = React.useMemo(
    () =>
      stops.map((s) => ({
        stop: s,
        haystack: `${s.name} ${s.bengaliName} ${s.code} ${s.zone} ${s.landmark}`.toLowerCase(),
      })),
    [stops]
  );

  const suggestions = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return stops.slice(0, 8);
    const matches: BusStop[] = [];
    for (let i = 0; i < indexedStops.length && matches.length < 8; i++) {
      if (indexedStops[i].haystack.includes(q)) {
        matches.push(indexedStops[i].stop);
      }
    }
    return matches;
  }, [value, stops, indexedStops]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      onChange(suggestions[activeIndex].name);
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        placeholder={placeholder}
        className="bg-white/60 backdrop-blur-md border border-white/80 h-10.5 text-xs text-[#4E342E] focus-visible:bg-white/85 focus-visible:ring-2 focus-visible:ring-[#CC5500]/30 focus-visible:border-[#CC5500] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)] rounded-xl"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl border border-[#4E342E]/15 bg-white/95 backdrop-blur-2xl shadow-[0_14px_32px_rgba(78,52,46,0.18)] max-h-56 overflow-y-auto py-1">
          {suggestions.map((stop, idx) => (
            <button
              key={stop.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(stop.name);
                setOpen(false);
                setActiveIndex(-1);
              }}
              className={`w-full text-left px-3 py-2 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                idx === activeIndex ? "bg-[#CC5500]/15" : "hover:bg-[#CC5500]/10"
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#4E342E] truncate">
                  {stop.name}
                  <span className="ml-1.5 text-[10px] font-medium text-[#7E655D]">
                    {stop.bengaliName}
                  </span>
                </div>
                <div className="text-[10px] text-[#7E655D] truncate">
                  {stop.zone} · {stop.landmark}
                </div>
              </div>
              <span className="shrink-0 text-[10px] font-mono font-bold text-[#CC5500] bg-[#CC5500]/10 px-1.5 py-0.5 rounded">
                {stop.connectingRoutes.length} lines
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchPageContent({
  fromParam,
  toParam,
}: {
  fromParam: string;
  toParam: string;
}) {
  const { data: apiRoutes } = useRoutes();
  const { data: apiStops } = useStops();
  const { data: apiBuses } = useLiveBuses(15000);
  const { savedRouteIds, toggleSavedRoute, addRecentSearch } = useSavedTransit();

  const routes = apiRoutes.length > 0 ? apiRoutes : KOLKATA_ROUTES;
  const stops = apiStops.length > 0 ? apiStops : KOLKATA_STOPS;
  const liveBuses = apiBuses.length > 0 ? apiBuses : ACTIVE_LIVE_BUSES;

  const [sourceStop, setSourceStop] = React.useState<string>(fromParam || "Howrah Station");
  const [destStop, setDestStop] = React.useState<string>(toParam || "Salt Lake Sector V");
  const [timePreset, setTimePreset] = React.useState<TimePreset>("now");
  const [filterType, setFilterType] = React.useState<string>("ALL");
  const [searchWord, setSearchWord] = React.useState<string>("");
  const deferredSearchWord = React.useDeferredValue(searchWord);
  const [selectedRouteId, setSelectedRouteId] = React.useState<string | null>(null);
  const [geocoding, setGeocoding] = React.useState(false);
  const [activeQuery, setActiveQuery] = React.useState<{
    from: string;
    to: string;
    fromCoord?: PlacePoint | null;
    toCoord?: PlacePoint | null;
  } | null>(() => (fromParam && toParam ? { from: fromParam, to: toParam } : null));

  const journeyResults = React.useMemo<JourneySearchResult | null>(() => {
    if (!activeQuery) return null;
    return findJourneys(activeQuery.from, activeQuery.to, routes, stops, {
      departureTime: resolvePresetDate(timePreset),
      liveBuses,
      fromCoord: activeQuery.fromCoord,
      toCoord: activeQuery.toCoord,
    });
  }, [activeQuery, routes, stops, timePreset, liveBuses]);

  const selectedRoute = React.useMemo<BusRoute | null>(() => {
    if (selectedRouteId) {
      return routes.find((r) => r.id === selectedRouteId) ?? routes[0] ?? null;
    }
    if (journeyResults && journeyResults.direct.length > 0) {
      return journeyResults.direct[0].route;
    }
    return routes[0] ?? null;
  }, [routes, selectedRouteId, journeyResults]);

  const runJourneySearch = React.useCallback(
    async (fromVal: string, toVal: string) => {
      const cleanFrom = fromVal.trim();
      const cleanTo = toVal.trim();
      if (!cleanFrom || !cleanTo) return;

      let fromCoord = resolveLocalPlace(cleanFrom, stops);
      let toCoord = resolveLocalPlace(cleanTo, stops);

      setActiveQuery({ from: cleanFrom, to: cleanTo, fromCoord, toCoord });

      // If either location is not a known stop/landmark, look up its real map coordinates
      // via /api/geocode and project onto bus route corridors automatically.
      if (!fromCoord || !toCoord) {
        setGeocoding(true);
        try {
          const lookup = async (q: string): Promise<PlacePoint | null> => {
            const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
            if (!r.ok) return null;
            const j = (await r.json()) as { success: boolean; place: PlacePoint | null };
            return j.place ?? null;
          };
          const [resolvedFromCoord, resolvedToCoord] = await Promise.all([
            fromCoord ? Promise.resolve(fromCoord) : lookup(cleanFrom),
            toCoord ? Promise.resolve(toCoord) : lookup(cleanTo),
          ]);
          fromCoord = resolvedFromCoord;
          toCoord = resolvedToCoord;
          setActiveQuery({ from: cleanFrom, to: cleanTo, fromCoord, toCoord });
        } catch {
          // Keep local match result on offline error
        } finally {
          setGeocoding(false);
        }
      }

      const res = findJourneys(cleanFrom, cleanTo, routes, stops, {
        departureTime: resolvePresetDate(timePreset),
        liveBuses,
        fromCoord,
        toCoord,
      });
      if (res.direct.length > 0) {
        setSelectedRouteId(res.direct[0].route.id);
      }
      const directNums = res.direct.map((d) => d.route.routeNumber);
      const connNums = res.connecting.map(
        (c) => `${c.firstLeg.route.routeNumber} → ${c.secondLeg.route.routeNumber}`
      );
      const summary = [...directNums, ...connNums.slice(0, 1)].join(", ") || "No direct match";
      addRecentSearch(res.resolvedFrom || cleanFrom, res.resolvedTo || cleanTo, summary);
    },
    [routes, stops, timePreset, liveBuses, addRecentSearch]
  );

  const handleSwap = () => {
    setSourceStop(destStop);
    setDestStop(sourceStop);
  };

  const filteredRoutes = React.useMemo(() => {
    const q = deferredSearchWord.trim().toLowerCase();
    return routes.filter((r) => {
      const matchSearch =
        !q ||
        r.routeNumber.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.source.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q) ||
        r.stops.some((s) => s.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (filterType === "AC") return r.busType === "AC_EXPRESS" || r.busType === "ELECTRIC";
      if (filterType === "ORDINARY") return r.busType === "ORDINARY";
      if (filterType === "MINIBUS") return r.busType === "MINIBUS";
      return true;
    });
  }, [routes, deferredSearchWord, filterType]);

  const savedRouteSet = React.useMemo(() => new Set(savedRouteIds), [savedRouteIds]);

  const popularStops = [
    "Barasat Chapadali",
    "Howrah Station",
    "Esplanade Bus Terminus",
    "Sealdah Station",
    "Salt Lake Sector V",
    "Netaji Subhash Airport (Gate 1)",
    "Dakshineswar",
    "Gariahat Junction",
  ];

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* ─── Top Header Banner ─── */}
      <div className="glass-chocolate-hero p-5.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-[#F8F4E7] drop-shadow-xs">
              Route Navigator & Planner
            </h1>
            <span className="bg-[#CC5500] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border border-white/30 shadow-sm">
              {routes.length} Kolkata Lines
            </span>
          </div>
          <p className="text-xs text-[#F8F4E7]/85 mt-1 max-w-xl leading-relaxed">
            Search real WBTC, CSTC & private Kolkata bus numbers, next departure & arrival times, 1-transfer links, and fares
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/25 backdrop-blur-xl border border-white/20 text-[#F8F4E7] text-xs font-bold shadow-inner">
            <Compass className="h-4 w-4 text-[#CC5500]" />
            <span>{stops.length} Kolkata Stops</span>
          </div>
        </div>
      </div>

      {/* ─── Responsive Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Origin ⇄ Destination Card */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runJourneySearch(sourceStop, destStop);
            }}
            className="rounded-2xl overflow-visible border border-white/60 border-b-[#4E342E]/15 bg-white/55 backdrop-blur-2xl shadow-[0_16px_40px_rgba(78,52,46,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)]"
          >
            <div className="bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] p-4 rounded-t-2xl border-b border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-[#F8F4E7] flex items-center gap-2">
                <Navigation className="h-4 w-4 text-[#CC5500]" />
                Journey Origin & Destination
              </span>
              <div className="flex items-center gap-1 bg-black/25 p-1 rounded-lg border border-white/15">
                {(
                  [
                    ["now", "Leave Now"],
                    ["morning", "9:00 AM"],
                    ["afternoon", "1:30 PM"],
                    ["evening", "6:00 PM"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTimePreset(key)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      timePreset === key
                        ? "bg-[#CC5500] text-white"
                        : "text-[#F8F4E7]/75 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 space-y-4 bg-white/40 backdrop-blur-xl rounded-b-2xl">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#CC5500] ring-4 ring-[#CC5500]/25 shadow-sm" />
                  <div className="w-0.5 h-10 bg-[#CC5500]/50" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#4E342E] ring-4 ring-[#4E342E]/20 shadow-sm" />
                </div>

                <div className="flex-1 space-y-2.5">
                  <StopAutocompleteInput
                    value={sourceStop}
                    onChange={setSourceStop}
                    stops={stops}
                    placeholder="Origin (e.g. Barasat, Howrah, Esplanade, any place...)"
                  />
                  <StopAutocompleteInput
                    value={destStop}
                    onChange={setDestStop}
                    stops={stops}
                    placeholder="Destination (e.g. Adamas University, Sector V, South City...)"
                  />
                </div>

                <Button
                  type="button"
                  size="icon"
                  onClick={handleSwap}
                  className="h-10.5 w-10.5 shrink-0 bg-[#CC5500] hover:bg-[#B34700] text-white border border-white/35 shadow-[0_4px_16px_rgba(204,85,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] rounded-xl transition-transform active:scale-90"
                  title="Swap Origin and Destination"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-[#7E655D] font-bold uppercase tracking-wider mr-1">
                  Quick Select:
                </span>
                {popularStops.map((stopName) => (
                  <button
                    key={stopName}
                    type="button"
                    onClick={() => {
                      if (!sourceStop.trim()) {
                        setSourceStop(stopName);
                      } else if (sourceStop.trim().toLowerCase() !== stopName.toLowerCase()) {
                        setDestStop(stopName);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/65 hover:bg-[#CC5500] hover:text-white border border-white/85 text-[10px] font-bold text-[#4E342E] transition-all cursor-pointer shadow-xs"
                  >
                    {stopName.replace(" Bus Terminus", "").replace(" Bus Stand", "").replace(" (Gate 1)", "")}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                disabled={geocoding}
                className="w-full bg-[#CC5500] hover:bg-[#B34700] text-white text-xs font-bold h-10.5 border border-white/35 shadow-[0_6px_20px_rgba(204,85,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] rounded-xl"
              >
                {geocoding ? "Checking Kolkata Map & Bus Corridors..." : "Find Kolkata Buses & Timings"}
              </Button>
            </div>
          </form>

          {/* Journey Planner Results */}
          {journeyResults && (
            <div className="rounded-2xl border border-[#CC5500]/30 bg-white/65 backdrop-blur-2xl p-4 space-y-3 shadow-[0_12px_32px_rgba(78,52,46,0.08)]">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#4E342E]">
                    {journeyResults.resolvedFrom} → {journeyResults.resolvedTo}
                  </h3>
                  <p className="text-[10px] text-[#7E655D] font-mono">
                    Departing around {journeyResults.searchTimeLabel} · {journeyResults.direct.length} direct,{" "}
                    {journeyResults.connecting.length} connecting
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveQuery(null)}
                  className="text-[11px] font-bold text-[#7E655D] hover:text-[#4E342E] cursor-pointer"
                >
                  Dismiss
                </button>
              </div>

              {journeyResults.direct.length === 0 && journeyResults.connecting.length === 0 ? (
                <p className="text-xs text-[#7E655D]">
                  No direct or 1-transfer bus routes matched those stops. Try selecting stop names from the dropdown suggestions.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {journeyResults.direct.map((leg) => (
                    <div
                      key={`${leg.route.id}-${leg.direction}`}
                      onClick={() => setSelectedRouteId(leg.route.id)}
                      className="p-3.5 rounded-xl bg-white/85 border border-white/95 hover:border-[#CC5500]/50 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-xs"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-[#CC5500] text-white text-[11px] font-black px-2 py-0.5 rounded-md">
                            {leg.route.routeNumber}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                            Direct · {leg.stopsBetween} stops
                          </span>
                          <span className="text-[10px] font-bold text-[#4E342E]/75 bg-[#4E342E]/8 px-2 py-0.5 rounded-md">
                            {leg.route.operator}
                          </span>
                          {leg.liveMatch && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#CC5500] bg-[#CC5500]/10 px-2 py-0.5 rounded-md">
                              <Radio className="h-2.5 w-2.5 animate-pulse" />
                              Live at {leg.liveMatch.nextStop} ({leg.liveMatch.etaNextStopMins}m)
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] font-bold text-[#4E342E] truncate">
                          {leg.route.name}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap text-xs font-black text-[#4E342E] font-mono tabular-nums">
                          <span>
                            {leg.schedule.departureTimeLabel} → {leg.schedule.arrivalTimeLabel}
                          </span>
                          <span className="text-[#CC5500]">({leg.estMins} min)</span>
                          <span className="text-[11px] font-sans font-bold text-[#7E655D]">
                            · ₹{leg.estFare}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-[#7E655D]">
                          <span className="font-semibold text-[#4E342E]">
                            {leg.schedule.inServiceNow
                              ? `Next bus in ${leg.schedule.waitMins}m`
                              : `Off-hours · First bus ${leg.schedule.departureTimeLabel}`}
                          </span>
                          <span>·</span>
                          <span>Every {leg.schedule.frequencyMins}m ({leg.schedule.trafficNote})</span>
                        </div>

                        <div className="text-[10px] text-[#7E655D] font-mono">
                          Next departures: {leg.schedule.upcomingDepartures.join(" · ")}
                        </div>
                        {leg.corridorMatchNote && (
                          <div className="text-[10px] font-semibold text-[#CC5500] bg-[#CC5500]/10 border border-[#CC5500]/20 px-2 py-0.5 rounded-md w-fit">
                            Route corridor match · {leg.corridorMatchNote}
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/?route=${encodeURIComponent(leg.route.routeNumber)}&from=${encodeURIComponent(leg.fromStopName)}&to=${encodeURIComponent(leg.toStopName)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0"
                      >
                        <Button size="sm" className="h-8 text-[11px] font-bold bg-[#4E342E] hover:bg-[#3A241F] text-white rounded-lg">
                          Track Live
                        </Button>
                      </Link>
                    </div>
                  ))}

                  {journeyResults.connecting.map((conn, i) => (
                    <div
                      key={`${conn.firstLeg.route.id}-${conn.secondLeg.route.id}-${i}`}
                      className="p-3.5 rounded-xl bg-[#F8F4E7]/90 border border-[#4E342E]/15 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold text-[#4E342E]">
                          <Repeat className="h-3.5 w-3.5 text-[#CC5500]" />
                          <span className="bg-[#4E342E] text-white text-[10px] px-2 py-0.5 rounded">
                            {conn.firstLeg.route.routeNumber}
                          </span>
                          <ArrowRight className="h-3 w-3 text-[#7E655D]" />
                          <span className="text-[11px] text-[#CC5500]">
                            Change at {conn.transferStop} (~{conn.transferWaitMins}m wait)
                          </span>
                          <ArrowRight className="h-3 w-3 text-[#7E655D]" />
                          <span className="bg-[#CC5500] text-white text-[10px] px-2 py-0.5 rounded">
                            {conn.secondLeg.route.routeNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-xs font-black text-[#4E342E] font-mono tabular-nums">
                          <span>
                            {conn.departureTimeLabel} → {conn.arrivalTimeLabel}
                          </span>
                          <span className="text-[#CC5500]">({conn.totalMins} min total)</span>
                          <span className="text-[11px] font-sans font-bold text-[#7E655D]">
                            · Est. ₹{conn.totalFare}
                          </span>
                        </div>
                      </div>
                      <Link href={`/?route=${encodeURIComponent(conn.firstLeg.route.routeNumber)}`}>
                        <Button size="sm" variant="outline" className="h-8 text-[11px] font-bold rounded-lg">
                          Track 1st Leg
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search bar & Type filter */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7E655D]" />
              <Input
                value={searchWord}
                onChange={(e) => setSearchWord(e.target.value)}
                placeholder="Filter by route (e.g. 45, AC-1, 12C) or any stop name..."
                className="pl-9 bg-white/55 backdrop-blur-xl border border-white/75 border-b-[#4E342E]/15 h-10 text-xs text-[#4E342E] focus-visible:bg-white/85 focus-visible:ring-2 focus-visible:ring-[#CC5500]/30 focus-visible:border-[#CC5500] rounded-xl shadow-[0_4px_16px_rgba(78,52,46,0.04),inset_0_1px_2px_rgba(255,255,255,0.9)]"
              />
            </div>

            <Tabs value={filterType} onValueChange={setFilterType} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-4 sm:flex w-full sm:w-auto bg-[#4E342E]/85 backdrop-blur-2xl border border-white/20 border-t-white/35 h-10 p-1 rounded-xl shadow-[0_8px_24px_rgba(78,52,46,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] text-[#F8F4E7]">
                <TabsTrigger
                  value="ALL"
                  className="text-xs px-3 data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:font-bold text-[#F8F4E7]/80 hover:text-white"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="AC"
                  className="text-xs px-3 data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:font-bold text-[#F8F4E7]/80 hover:text-white"
                >
                  AC
                </TabsTrigger>
                <TabsTrigger
                  value="ORDINARY"
                  className="text-xs px-3 data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:font-bold text-[#F8F4E7]/80 hover:text-white"
                >
                  Ordinary
                </TabsTrigger>
                <TabsTrigger
                  value="MINIBUS"
                  className="text-xs px-3 data-[state=active]:bg-[#CC5500] data-[state=active]:text-white data-[state=active]:font-bold text-[#F8F4E7]/80 hover:text-white"
                >
                  Minibus
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Route Listing */}
          <div className="space-y-2.5">
            {filteredRoutes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              const isSaved = savedRouteSet.has(route.id);
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`route-card-opt p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? "bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] border-[#CC5500] border-l-4 border-l-[#CC5500] shadow-[0_12px_32px_rgba(78,52,46,0.28),inset_0_1px_1px_rgba(255,255,255,0.25)] scale-[1.01]"
                      : "bg-white/50 backdrop-blur-xl hover:bg-white/70 text-[#4E342E] border-white/75 border-b-[#4E342E]/15 hover:border-[#CC5500]/40 shadow-[0_6px_20px_rgba(78,52,46,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-md border ${
                            route.busType === "AC_EXPRESS"
                              ? "bg-[#CC5500] text-white border-white/30 shadow-xs"
                              : route.busType === "MINIBUS"
                                ? "bg-[#B25900] text-white border-white/30 shadow-xs"
                                : isSelected
                                  ? "bg-[#CC5500]/35 text-white border-[#CC5500]/50"
                                  : "bg-[#4E342E]/12 text-[#4E342E] border-[#4E342E]/15"
                          }`}
                        >
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

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSavedRoute(route.id);
                        }}
                        title={isSaved ? "Remove from Saved Routes" : "Save Route"}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isSaved
                            ? "text-[#CC5500]"
                            : isSelected
                              ? "text-[#F8F4E7]/60 hover:text-white"
                              : "text-[#7E655D] hover:text-[#4E342E]"
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 ${isSaved ? "fill-[#CC5500]" : ""}`} />
                      </button>
                      <div className="text-right">
                        <span className="text-xs font-mono font-black text-[#CC5500] tabular-nums block">
                          ₹{route.fareMin} - ₹{route.fareMax}
                        </span>
                        <span className={`text-[10px] block ${isSelected ? "text-[#F8F4E7]/75" : "text-[#7E655D]"}`}>
                          Est. Fare
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between text-[11px] pt-2 border-t ${
                      isSelected ? "border-white/18 text-[#F8F4E7]/85" : "border-[#4E342E]/10 text-[#7E655D]"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5 text-[#CC5500]" />
                      <span>Every {route.frequencyMins} mins</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium font-mono tabular-nums">
                      <span>{route.stops.length} Stops</span>
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
              <div className="bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] p-4.5 pb-4 border-b border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-[#CC5500] text-white px-2.5 py-0.5 rounded-lg shadow-sm border border-white/30">
                        {selectedRoute.routeNumber}
                      </span>
                      <span className="text-xs font-bold text-[#F8F4E7]/90">{selectedRoute.operator}</span>
                    </div>
                    <h3 className="text-sm font-black text-[#F8F4E7] mt-2">{selectedRoute.name}</h3>
                    <p className="text-xs text-[#F8F4E7]/80 mt-0.5">
                      {selectedRoute.source} ⇄ {selectedRoute.destination}
                    </p>
                  </div>

                  <span className="text-xs font-mono font-bold text-white bg-[#CC5500]/30 border border-white/30 px-2.5 py-1 rounded-lg shadow-xs">
                    {selectedRoute.distanceKm} km
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4 bg-white/45 backdrop-blur-xl">
                <div className="grid grid-cols-3 gap-2 bg-white/60 backdrop-blur-md p-3 rounded-xl border border-white/85 text-center shadow-xs">
                  <div>
                    <span className="text-[10px] text-[#7E655D] uppercase font-bold tracking-wider block">
                      Duration
                    </span>
                    <span className="text-xs font-bold text-[#4E342E] font-mono tabular-nums mt-0.5 block">
                      {selectedRoute.avgTripMins}m
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7E655D] uppercase font-bold tracking-wider block">
                      Cadence
                    </span>
                    <span className="text-xs font-black text-[#CC5500] font-mono tabular-nums mt-0.5 block">
                      Every {selectedRoute.frequencyMins}m
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7E655D] uppercase font-bold tracking-wider block">
                      Fare Band
                    </span>
                    <span className="text-xs font-bold text-[#4E342E] font-mono tabular-nums mt-0.5 block">
                      ₹{selectedRoute.fareMin}-{selectedRoute.fareMax}
                    </span>
                  </div>
                </div>
                {(selectedRoute.firstBusTime || selectedRoute.lastBusTime) && (
                  <div className="flex items-center justify-between text-[11px] px-3 py-2 rounded-lg bg-[#F8F4E7]/80 border border-[#4E342E]/10 text-[#4E342E]">
                    <span className="font-bold">Daily Service Hours</span>
                    <span className="font-mono font-bold text-[#CC5500]">
                      {selectedRoute.firstBusTime ?? "05:30"} – {selectedRoute.lastBusTime ?? "22:15"}
                    </span>
                  </div>
                )}

                {/* Stop by Stop Vertical Timeline */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#4E342E]">
                    Sequential Station Stops ({selectedRoute.stops.length})
                  </h4>

                  <div className="space-y-2.5 pl-3 border-l-2 border-[#CC5500] ml-2 py-1">
                    {(selectedRoute.stopPoints ??
                      selectedRoute.stops.map((name, idx) => ({
                        stopId: `${idx}`,
                        name,
                        typicalTimeMins: Math.round(
                          (idx / Math.max(1, selectedRoute.stops.length - 1)) * selectedRoute.avgTripMins
                        ),
                        fareFromStart: selectedRoute.fareMin,
                      }))
                    ).map((pt, idx) => (
                      <div key={pt.stopId + idx} className="flex items-center justify-between gap-2 text-xs group">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#CC5500] -ml-[17px] ring-4 ring-white/90 shadow-sm shrink-0" />
                          <span className="font-bold text-[#4E342E] group-hover:text-[#CC5500] transition-colors">
                            {pt.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#7E655D]">
                          +{pt.typicalTimeMins}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                  <Link
                    href={`/?route=${encodeURIComponent(selectedRoute.routeNumber)}&from=${encodeURIComponent(selectedRoute.source)}&to=${encodeURIComponent(selectedRoute.destination)}`}
                    className="block"
                  >
                  <Button className="w-full bg-[#CC5500] hover:bg-[#B34700] text-white text-xs font-bold h-10.5 border border-white/35 shadow-[0_6px_20px_rgba(204,85,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] rounded-xl gap-2">
                    <Bus className="h-4 w-4" />
                    Track Active Buses On {selectedRoute.routeNumber}
                  </Button>
                </Link>
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

function SearchPageInner() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";
  return (
    <SearchPageContent
      key={`${fromParam}:${toParam}`}
      fromParam={fromParam}
      toParam={toParam}
    />
  );
}

export default function SearchPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-xs font-bold text-[#4E342E]">
          Loading Route Navigator...
        </div>
      }
    >
      <SearchPageInner />
    </React.Suspense>
  );
}
