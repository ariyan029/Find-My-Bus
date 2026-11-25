"use client";

import * as React from "react";
import Link from "next/link";
import {
  Radio,
  Cpu,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  Send,
  Wifi,
  BatteryCharging,
  Satellite,
  Bus,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ACTIVE_LIVE_BUSES, KOLKATA_ROUTES } from "@/lib/data";
import {
  BUS_STATUSES,
  BUS_STATUS_LABELS,
  BusStatus,
  OCCUPANCIES,
  OCCUPANCY_LABELS,
  Occupancy,
  TELEMETRY_SOURCE_LABELS,
} from "@/lib/enums";
import { useIoTDevices, useLiveBuses, useRoutes } from "@/lib/api";
import { useLocationSharing } from "@/lib/useLocationSharing";

export default function DriverIoTPage() {
  const { data: apiBuses } = useLiveBuses(8000);
  const { data: apiRoutes } = useRoutes();
  const iotFeed = useIoTDevices(5000);

  const buses = apiBuses.length > 0 ? apiBuses : ACTIVE_LIVE_BUSES;
  const routes = apiRoutes.length > 0 ? apiRoutes : KOLKATA_ROUTES;

  // Driver broadcast controls
  const [selectedBusId, setSelectedBusId] = React.useState<string>(ACTIVE_LIVE_BUSES[0].id);
  const [driverName, setDriverName] = React.useState<string>("Subhasish Ghosh");
  const [occupancyStatus, setOccupancyStatus] = React.useState<Occupancy>("SEATS_AVAILABLE");
  const [busStatus, setBusStatus] = React.useState<BusStatus>("ON_ROUTE");
  const [simulating, setSimulating] = React.useState<boolean>(false);
  const [simStepCount, setSimStepCount] = React.useState<number>(0);

  // ESP32 manual test ping form
  const [testDeviceId, setTestDeviceId] = React.useState<string>("esp32-wb01-101");
  const [testBusNumber, setTestBusNumber] = React.useState<string>("S-12");
  const [testLat, setTestLat] = React.useState<string>("22.5815");
  const [testLng, setTestLng] = React.useState<string>("88.4160");
  const [testSpeed, setTestSpeed] = React.useState<string>("36");
  const [testStatusMsg, setTestStatusMsg] = React.useState<string | null>(null);

  const driverSharing = useLocationSharing({
    mode: "driver",
    driverName,
    occupancyStatus,
    busStatus,
  });

  const selectedBus = React.useMemo(
    () => buses.find((b) => b.id === selectedBusId) || buses[0] || ACTIVE_LIVE_BUSES[0],
    [buses, selectedBusId]
  );

  const simStepRef = React.useRef<number>(0);
  const simContextRef = React.useRef({
    selectedBus,
    routes,
    driverName,
    occupancyStatus,
    busStatus,
  });
  React.useEffect(() => {
    simContextRef.current = {
      selectedBus,
      routes,
      driverName,
      occupancyStatus,
      busStatus,
    };
  });

  // Indoor/desktop route simulation loop using real /api/driver/broadcast calls.
  React.useEffect(() => {
    if (!simulating) return;
    simStepRef.current = 0;
    const controller = new AbortController();

    const tick = async () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      const ctx = simContextRef.current;
      const bus = ctx.selectedBus;
      const route =
        ctx.routes.find(
          (r) =>
            r.id === bus.routeId ||
            r.routeNumber.toLowerCase() === bus.busNumber.toLowerCase()
        ) || ctx.routes[0];
      const pts = route?.stopPoints;
      if (!pts || pts.length < 2) return;

      const totalSubSteps = (pts.length - 1) * 4;
      const progress = (simStepRef.current % totalSubSteps) / totalSubSteps;
      const scaled = progress * (pts.length - 1);
      const segIdx = Math.min(pts.length - 2, Math.floor(scaled));
      const t = scaled - segIdx;
      const a = pts[segIdx];
      const b = pts[segIdx + 1];

      const lat = a.lat + (b.lat - a.lat) * t;
      const lng = a.lng + (b.lng - a.lng) * t;
      const heading = Math.round(
        ((Math.atan2(b.lng - a.lng, b.lat - a.lat) * 180) / Math.PI + 360) % 360
      );

      try {
        const res = await fetch("/api/driver/broadcast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            busId: bus.id,
            busNumber: bus.busNumber,
            regNumber: bus.regNumber,
            driverId: `sim-${bus.id}`,
            driverName: ctx.driverName,
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lng.toFixed(6)),
            accuracyMeters: 8,
            speedKmh: 32,
            heading,
            occupancyStatus: ctx.occupancyStatus,
            status: ctx.busStatus,
          }),
        });
        if (!controller.signal.aborted && res.ok) {
          setSimStepCount((c) => c + 1);
        }
      } catch {
        // Ignore abort or transient network error
      }
      simStepRef.current += 1;
    };

    void tick();
    const timer = setInterval(() => void tick(), 3000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [simulating, selectedBusId]);

  const sendTestEspPing = async (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = Number(testLat);
    const lngNum = Number(testLng);
    const speedNum = Number(testSpeed);
    if (
      !testDeviceId.trim() ||
      !testBusNumber.trim() ||
      !Number.isFinite(latNum) ||
      !Number.isFinite(lngNum) ||
      latNum < -90 ||
      latNum > 90 ||
      lngNum < -180 ||
      lngNum > 180 ||
      !Number.isFinite(speedNum) ||
      speedNum < 0
    ) {
      setTestStatusMsg("Enter valid Device ID, Bus Number, coordinates, and speed.");
      return;
    }

    setTestStatusMsg("Sending ESP32 telemetry...");
    try {
      const res = await fetch("/api/iot/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: testDeviceId.trim(),
          busNumber: testBusNumber.trim(),
          lat: latNum,
          lng: lngNum,
          speed: speedNum,
          course: 88,
          sats: 9,
          batt: 91,
          rssi: -63,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setTestStatusMsg(`Error: ${json.error || res.status}`);
      } else {
        setTestStatusMsg(
          `Accepted (${json.storageMode}) -> updated ${json.busNumber} (${json.matchedBusId})`
        );
        iotFeed.refresh();
      }
    } catch {
      setTestStatusMsg("Network error sending ping");
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* ─── Header Banner ─── */}
      <div className="glass-chocolate-hero p-5.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-black tracking-tight text-[#F8F4E7] drop-shadow-xs">
              Driver & ESP32 IoT Telemetry Console
            </h1>
            <span className="bg-[#CC5500] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border border-white/30 shadow-sm">
              Live Transmitter
            </span>
          </div>
          <p className="text-xs text-[#F8F4E7]/85 mt-1 max-w-xl leading-relaxed">
            Transmit live GPS from a driver&apos;s phone or monitor onboard ESP32 + NEO-6M GPS hardware units fitted on Kolkata buses
          </p>
        </div>

        <Link href="/" className="self-start sm:self-auto shrink-0">
          <Button
            size="sm"
            className="bg-[#CC5500] hover:bg-[#B34700] text-white text-xs font-bold border border-white/30 rounded-xl gap-1.5"
          >
            <Bus className="h-3.5 w-3.5" />
            View Live Map
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="driver" className="w-full space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md bg-[#4E342E]/85 backdrop-blur-2xl border border-white/20 p-1 rounded-xl text-[#F8F4E7]">
          <TabsTrigger
            value="driver"
            className="text-xs font-bold data-[state=active]:bg-[#CC5500] data-[state=active]:text-white text-[#F8F4E7]/80 gap-1.5"
          >
            <Navigation className="h-3.5 w-3.5" />
            Driver Mobile Mode
          </TabsTrigger>
          <TabsTrigger
            value="iot"
            className="text-xs font-bold data-[state=active]:bg-[#CC5500] data-[state=active]:text-white text-[#F8F4E7]/80 gap-1.5"
          >
            <Cpu className="h-3.5 w-3.5" />
            ESP32 IoT Fleet ({iotFeed.devices.length})
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: DRIVER MOBILE TRANSMITTER ─── */}
        <TabsContent value="driver" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-white/60 bg-white/55 backdrop-blur-2xl shadow-[0_16px_40px_rgba(78,52,46,0.12)]">
            <div className="bg-[#4E342E]/86 text-[#F8F4E7] p-4 border-b border-white/20 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Radio className="h-4 w-4 text-[#CC5500]" />
                Driver Onboard Broadcast Setup
              </span>
              <span className="text-[10px] font-mono text-[#F8F4E7]/80">5s GPS Interval</span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#4E342E]">
                    Select Assigned Bus
                  </label>
                  <select
                    value={selectedBus.id}
                    onChange={(e) => setSelectedBusId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white/75 border border-[#4E342E]/15 text-xs font-bold text-[#4E342E] focus:outline-none focus:ring-2 focus:ring-[#CC5500]"
                  >
                    {buses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.busNumber} · {b.regNumber} ({b.destination})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#4E342E]">
                    Driver Name
                  </label>
                  <Input
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Driver full name"
                    className="h-10 bg-white/75 text-xs text-[#4E342E] rounded-xl"
                  />
                </div>
              </div>

              {/* Occupancy Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#4E342E] block">
                  Live Passenger Occupancy
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {OCCUPANCIES.map((occ) => (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => setOccupancyStatus(occ)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        occupancyStatus === occ
                          ? "bg-[#CC5500] text-white border-[#CC5500] shadow-sm"
                          : "bg-white/65 text-[#4E342E] border-white/85 hover:bg-white"
                      }`}
                    >
                      {OCCUPANCY_LABELS[occ]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trip Status Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#4E342E] block">
                  Corridor Trip Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {BUS_STATUSES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBusStatus(st)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        busStatus === st
                          ? "bg-[#4E342E] text-[#F8F4E7] border-[#4E342E] shadow-sm"
                          : "bg-white/65 text-[#4E342E] border-white/85 hover:bg-white"
                      }`}
                    >
                      {BUS_STATUS_LABELS[st]}
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="bg-[#4E342E]/10" />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    if (driverSharing.status === "sharing" || driverSharing.status === "locating") {
                      driverSharing.stop();
                    } else {
                      setSimulating(false);
                      driverSharing.start(selectedBus);
                    }
                  }}
                  className={`flex-1 h-11 rounded-xl text-xs font-bold gap-2 ${
                    driverSharing.status === "sharing"
                      ? "bg-red-700 hover:bg-red-800 text-white"
                      : "bg-[#CC5500] hover:bg-[#B34700] text-white shadow-[0_6px_20px_rgba(204,85,0,0.4)]"
                  }`}
                >
                  {driverSharing.status === "sharing" ? (
                    <>
                      <Square className="h-4 w-4" />
                      Stop Driver GPS ({driverSharing.sentCount} sent)
                    </>
                  ) : driverSharing.status === "locating" ? (
                    <>
                      <Radio className="h-4 w-4 animate-spin" />
                      Acquiring Phone GPS...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start Live Driver GPS Broadcast
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (simulating) {
                      setSimulating(false);
                    } else {
                      driverSharing.stop();
                      setSimStepCount(0);
                      setSimulating(true);
                    }
                  }}
                  className="h-11 rounded-xl text-xs font-bold border-[#4E342E]/25 bg-white/75 text-[#4E342E] hover:bg-white gap-2"
                >
                  <Activity className={`h-4 w-4 text-[#CC5500] ${simulating ? "animate-pulse" : ""}`} />
                  {simulating ? `Stop Demo Run (${simStepCount})` : "Simulate Route Run (Demo)"}
                </Button>
              </div>

              {driverSharing.status === "sharing" && (
                <div className="p-3 rounded-xl bg-emerald-500/12 border border-emerald-600/30 text-xs text-[#4E342E] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    Transmitting Driver Location for {selectedBus.busNumber} ({selectedBus.regNumber})
                  </div>
                  {driverSharing.lastCoords && (
                    <p className="font-mono text-[11px] text-[#7E655D]">
                      Lat: {driverSharing.lastCoords.lat.toFixed(5)} · Lng:{" "}
                      {driverSharing.lastCoords.lng.toFixed(5)} · Accuracy: ±
                      {Math.round(driverSharing.accuracyMeters ?? 0)}m
                    </p>
                  )}
                </div>
              )}

              {simulating && (
                <div className="p-3 rounded-xl bg-[#CC5500]/12 border border-[#CC5500]/35 text-xs text-[#4E342E] flex items-center justify-between">
                  <span className="font-bold">
                    Demo run active on {selectedBus.busNumber} ({simStepCount} updates pushed)
                  </span>
                  <Link href={`/?bus=${encodeURIComponent(selectedBus.id)}`} className="font-bold text-[#CC5500] hover:underline">
                    Watch on Map →
                  </Link>
                </div>
              )}

              {(driverSharing.error || driverSharing.warning) && (
                <div className="p-3 rounded-xl bg-red-700/12 border border-red-700/25 text-red-900 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
                  <span>{driverSharing.error || driverSharing.warning}</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-[#4E342E]/86 text-[#F8F4E7] p-5 border border-white/20 space-y-3 shadow-[0_16px_40px_rgba(78,52,46,0.25)]">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#CC5500]">
              How Driver & Rider Sync Works
            </h3>
            <ul className="space-y-2.5 text-xs text-[#F8F4E7]/85 leading-relaxed">
              <li>
                <strong className="text-white">1. Authoritative Priority:</strong> Coordinates from an onboard{" "}
                <span className="font-mono text-[#CC5500]">ESP32 IoT</span> unit or{" "}
                <span className="font-mono text-[#CC5500]">Driver App</span> take priority over passive passenger GPS pings.
              </li>
              <li>
                <strong className="text-white">2. Screen Wake Lock:</strong> Keeps the driver&apos;s mobile browser awake so GPS watch ticks every 5 seconds.
              </li>
              <li>
                <strong className="text-white">3. Live ETA Updates:</strong> Each ping recalculates the bus&apos;s nearest corridor segment, next stop, and ETA for riders on the Home map.
              </li>
            </ul>
          </div>
        </TabsContent>

        {/* ─── TAB 2: ESP32 IOT HARDWARE FLEET ─── */}
        <TabsContent value="iot" className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl overflow-hidden border border-white/60 bg-white/55 backdrop-blur-2xl shadow-[0_16px_40px_rgba(78,52,46,0.12)]">
              <div className="bg-[#4E342E]/86 text-[#F8F4E7] p-4 border-b border-white/20 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-[#CC5500]" />
                  Registered ESP32 Bus Trackers
                </span>
                <span className="text-[10px] font-mono text-[#F8F4E7]/80">
                  Mode: {iotFeed.storageMode}
                </span>
              </div>

              <div className="p-4 space-y-2.5">
                {iotFeed.devices.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-3.5 rounded-xl bg-white/75 border border-white/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dev.connectionState === "online"
                              ? "bg-emerald-500"
                              : dev.connectionState === "stale"
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                        />
                        <span className="font-mono font-black text-[#4E342E]">{dev.id}</span>
                        <span className="bg-[#CC5500] text-white text-[10px] font-black px-2 py-0.5 rounded-md">
                          {dev.busNumber}
                        </span>
                        <span className="text-[10px] text-[#7E655D] font-mono">
                          {dev.hardwareType} v{dev.firmwareVersion}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-[#7E655D]">
                        {dev.lastLat != null && dev.lastLng != null
                          ? `${dev.lastLat.toFixed(5)}, ${dev.lastLng.toFixed(5)}`
                          : "No GPS fix yet"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-[#4E342E] shrink-0">
                      {dev.satellites != null && (
                        <span className="flex items-center gap-1">
                          <Satellite className="h-3.5 w-3.5 text-[#CC5500]" />
                          {dev.satellites} sat
                        </span>
                      )}
                      {dev.batteryPct != null && (
                        <span className="flex items-center gap-1">
                          <BatteryCharging className="h-3.5 w-3.5 text-emerald-700" />
                          {dev.batteryPct}%
                        </span>
                      )}
                      {dev.signalRssi != null && (
                        <span className="flex items-center gap-1">
                          <Wifi className="h-3.5 w-3.5 text-[#4E342E]" />
                          {dev.signalRssi} dBm
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Ingestion Stream */}
            <div className="rounded-2xl overflow-hidden border border-white/60 bg-white/55 backdrop-blur-2xl p-4 space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#4E342E]">
                Recent Telemetry Ingestion Stream
              </h3>
              {iotFeed.recentPings.length === 0 ? (
                <p className="text-xs text-[#7E655D]">
                  No new live pings received in this session yet. Send a test ESP32 ping or start a Driver broadcast.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {iotFeed.recentPings.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg bg-white/75 border border-white/85 flex items-center justify-between text-[11px] font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#CC5500]">{p.busNumber}</span>
                        <span className="text-[#4E342E]">{TELEMETRY_SOURCE_LABELS[p.source]}</span>
                        {p.deviceId && <span className="text-[#7E655D]">({p.deviceId})</span>}
                      </div>
                      <span className="text-[#7E655D]">
                        {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: ESP32 Ping Tester + API Reference */}
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={sendTestEspPing}
              className="rounded-2xl overflow-hidden border border-white/60 bg-white/55 backdrop-blur-2xl shadow-[0_16px_40px_rgba(78,52,46,0.12)]"
            >
              <div className="bg-[#4E342E]/86 text-[#F8F4E7] p-4 border-b border-white/20">
                <span className="text-xs font-black uppercase tracking-wider">
                  Test ESP32 Hardware Endpoint
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <Input
                    value={testDeviceId}
                    onChange={(e) => setTestDeviceId(e.target.value)}
                    placeholder="Device ID"
                    className="h-9 bg-white/75 text-xs font-mono"
                  />
                  <Input
                    value={testBusNumber}
                    onChange={(e) => setTestBusNumber(e.target.value)}
                    placeholder="Bus (e.g. S-12)"
                    className="h-9 bg-white/75 text-xs font-mono"
                  />
                  <Input
                    value={testLat}
                    onChange={(e) => setTestLat(e.target.value)}
                    placeholder="Latitude"
                    className="h-9 bg-white/75 text-xs font-mono"
                  />
                  <Input
                    value={testLng}
                    onChange={(e) => setTestLng(e.target.value)}
                    placeholder="Longitude"
                    className="h-9 bg-white/75 text-xs font-mono"
                  />
                </div>
                <Input
                  value={testSpeed}
                  onChange={(e) => setTestSpeed(e.target.value)}
                  placeholder="Speed km/h"
                  className="h-9 bg-white/75 text-xs font-mono"
                />
                <Button
                  type="submit"
                  className="w-full h-9.5 bg-[#CC5500] hover:bg-[#B34700] text-white text-xs font-bold rounded-xl gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send POST /api/iot/telemetry
                </Button>
                {testStatusMsg && (
                  <p className="text-[11px] font-mono text-[#4E342E] bg-white/80 p-2 rounded-lg border border-[#4E342E]/10">
                    {testStatusMsg}
                  </p>
                )}
              </div>
            </form>

            <div className="rounded-2xl bg-[#1C1210]/95 text-[#F8F4E7] p-4 space-y-2 font-mono text-[11px] border border-white/15">
              <p className="text-[#CC5500] font-bold">ESP32 Firmware Endpoint:</p>
              <p className="text-emerald-400">POST /api/iot/telemetry</p>
              <pre className="overflow-x-auto text-[10px] text-[#F8F4E7]/85 leading-relaxed">
{`{
  "deviceId": "esp32-wb01-101",
  "busNumber": "S-12",
  "lat": 22.5802,
  "lng": 88.4110,
  "speed": 38.5,
  "course": 85,
  "sats": 9,
  "batt": 92
}`}
              </pre>
              <p className="text-[10px] text-[#F8F4E7]/65">
                Arduino sketch included at <span className="text-white">iot/esp32_gps_tracker/esp32_gps_tracker.ino</span>
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
