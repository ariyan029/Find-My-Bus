"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Database,
  Award,
  Terminal,
  Cpu,
  Radio,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSystemHealth } from "@/lib/api";
import { getContributorId } from "@/lib/useLocationSharing";
import { useSavedTransit } from "@/lib/useSavedTransit";

const EMPTY_SUBSCRIBE = () => () => {};

export default function ProfilePage() {
  const health = useSystemHealth(10000);
  const { preferences, setPreference, stats } = useSavedTransit();
  const deviceId = React.useSyncExternalStore(
    EMPTY_SUBSCRIBE,
    getContributorId,
    () => "loading..."
  );

  const shortId = deviceId.slice(0, 8).toUpperCase();

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* ─── Top Header Banner ─── */}
      <div className="glass-chocolate-hero p-5.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-[#F8F4E7] drop-shadow-xs">
              Commuter ID & Telemetry Console
            </h1>
            <span className="bg-[#CC5500] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border border-white/30 shadow-sm">
              Anonymous Device ID
            </span>
          </div>
          <p className="text-xs text-[#F8F4E7]/85 mt-1 max-w-xl leading-relaxed">
            Inspect your device&apos;s real contribution stats, offline cache settings, and live backend health
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/25 backdrop-blur-xl border border-white/20 text-[#F8F4E7] text-xs font-bold shadow-inner">
            <Cpu className="h-4 w-4 text-[#CC5500]" />
            <span>
              {health
                ? health.postgresConnected
                  ? "PostGIS Connected"
                  : "Memory Fallback Active"
                : "Checking Backend..."}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Responsive Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Profile Identity Card */}
          <div className="rounded-2xl border border-white/25 bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] p-5.5 shadow-[0_16px_40px_rgba(78,52,46,0.32),inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center gap-4.5">
            <Avatar className="h-16 w-16 border-2 border-white/80 ring-4 ring-[#CC5500]/40 shadow-[0_6px_20px_rgba(204,85,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]">
              <AvatarFallback className="bg-[#CC5500] text-white font-black text-xl">
                PK
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-white">Kolkata Commuter</h2>
                <span className="bg-[#CC5500] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/30 shadow-xs">
                  ID #{shortId}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#F8F4E7]/70 truncate">{deviceId}</p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-[#CC5500] font-bold bg-black/25 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/15 w-fit">
                <Award className="h-3.5 w-3.5 text-[#CC5500]" />
                <span>
                  {stats.pingsSent >= 20
                    ? "Active Transit Contributor"
                    : "Ready to Broadcast"}
                </span>
              </div>
            </div>
          </div>

          {/* Real Contribution Metric Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-white/75 border-b-[#4E342E]/15 bg-white/50 backdrop-blur-xl p-3 text-center shadow-[0_6px_20px_rgba(78,52,46,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)]">
              <p className="text-[10px] uppercase font-bold text-[#7E655D] tracking-wider">Pings Sent</p>
              <p className="text-lg font-black text-[#4E342E] mt-1 font-mono tabular-nums">
                {stats.pingsSent}
              </p>
            </div>
            <div className="rounded-xl border border-white/20 bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] p-3 text-center shadow-[0_10px_30px_rgba(78,52,46,0.25),inset_0_1px_1px_rgba(255,255,255,0.25)]">
              <p className="text-[10px] uppercase font-bold text-[#F8F4E7]/75 tracking-wider">KM Logged</p>
              <p className="text-lg font-black text-[#CC5500] mt-1 font-mono tabular-nums">
                {stats.kmLogged.toFixed(1)}
              </p>
            </div>
            <div className="rounded-xl border border-white/75 border-b-[#4E342E]/15 bg-white/50 backdrop-blur-xl p-3 text-center shadow-[0_6px_20px_rgba(78,52,46,0.06),inset_0_1px_1px_rgba(255,255,255,0.85)]">
              <p className="text-[10px] uppercase font-bold text-[#7E655D] tracking-wider">IoT Online</p>
              <p className="text-lg font-black text-emerald-800 mt-1 font-mono tabular-nums">
                {health ? `${health.iotDevicesOnline}/${health.iotDevicesCount}` : "—"}
              </p>
            </div>
          </div>

          {/* Persistent Preferences & Toggles */}
          <div className="rounded-2xl overflow-hidden border border-white/60 border-b-[#4E342E]/15 bg-white/55 backdrop-blur-2xl shadow-[0_16px_40px_rgba(78,52,46,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <div className="bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] p-4 border-b border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#F8F4E7]">
                Crowdsource & Cache Preferences
              </span>
              <span className="text-[10px] text-[#F8F4E7]/75 font-mono">Saved Locally</span>
            </div>

            <div className="p-5 space-y-4 bg-white/40 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-[#4E342E]">Wake-Lock GPS Contribution</h3>
                  <p className="text-[11px] text-[#7E655D]">Keeps screen active while broadcasting location</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setPreference("bgTracking", !preferences.bgTracking)}
                  className={`h-8 text-xs px-3 font-bold rounded-xl border ${
                    preferences.bgTracking
                      ? "bg-[#CC5500] hover:bg-[#B34700] text-white border-white/30 shadow-[0_4px_14px_rgba(204,85,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                      : "border-white/80 bg-white/60 text-[#4E342E]"
                  }`}
                >
                  {preferences.bgTracking ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <Separator className="bg-[#4E342E]/10" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-[#4E342E]">Offline Route Preloading</h3>
                  <p className="text-[11px] text-[#7E655D]">Caches Kolkata bus stops for low-network zones</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setPreference("autoOffline", !preferences.autoOffline)}
                  className={`h-8 text-xs px-3 font-bold rounded-xl border ${
                    preferences.autoOffline
                      ? "bg-[#CC5500] hover:bg-[#B34700] text-white border-white/30 shadow-[0_4px_14px_rgba(204,85,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)]"
                      : "border-white/80 bg-white/60 text-[#4E342E]"
                  }`}
                >
                  {preferences.autoOffline ? "Active" : "Off"}
                </Button>
              </div>

              <Separator className="bg-[#4E342E]/10" />

              <Link href="/driver" className="block">
                <Button className="w-full bg-[#4E342E] hover:bg-[#3A241F] text-[#F8F4E7] text-xs font-bold h-9.5 rounded-xl gap-2">
                  <Radio className="h-3.5 w-3.5 text-[#CC5500]" />
                  Open Driver & ESP32 IoT Console
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Live Backend Health & Architecture Console */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-white/60 border-b-[#4E342E]/15 bg-white/55 backdrop-blur-2xl shadow-[0_16px_40px_rgba(78,52,46,0.12),inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <div className="bg-[#4E342E]/86 backdrop-blur-2xl text-[#F8F4E7] p-4.5 border-b border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] flex items-center justify-between">
              <div>
                <h3 className="text-xs uppercase font-black tracking-wider text-[#F8F4E7] flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#CC5500]" />
                  Live Telemetry & PostgreSQL Health
                </h3>
                <p className="text-xs text-[#F8F4E7]/75 mt-0.5">
                  Real-time probe from /api/health
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-white bg-[#CC5500] px-2.5 py-1 rounded-md border border-white/30 shadow-xs">
                {health?.storageMode?.toUpperCase() || "CHECKING"}
              </span>
            </div>

            <div className="p-5 space-y-4 bg-white/40 backdrop-blur-xl">
              <div className="p-4 rounded-xl bg-[#1C1210]/90 backdrop-blur-2xl text-[#F8F4E7] space-y-2.5 font-mono text-xs shadow-inner border border-white/14">
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[#F8F4E7]/60">PostgreSQL / PostGIS:</span>
                  <span className={health?.postgresConnected ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {health ? (health.postgresConnected ? "Connected (Port 5432)" : "Offline (Using In-Memory Live Store)") : "Probing..."}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[#F8F4E7]/60">Active Buses Tracked:</span>
                  <span className="text-[#CC5500] font-black">{health?.activeBusesCount ?? "—"}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[#F8F4E7]/60">ESP32 IoT Units Online:</span>
                  <span className="text-[#F8F4E7] font-bold">
                    {health ? `${health.iotDevicesOnline} / ${health.iotDevicesCount}` : "—"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[#F8F4E7]/60">Adapter:</span>
                  <span className="text-emerald-400 font-bold">@prisma/adapter-pg + pg.Pool</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#F8F4E7]/60">Last Health Check:</span>
                  <span className="text-[#F8F4E7]/85">
                    {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : "—"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[#7E655D] pt-1">
                <span className="font-bold text-[#4E342E] block">To enable persistent PostgreSQL + PostGIS storage:</span>
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md p-3 rounded-xl border border-white/80 font-mono text-[11px] text-[#4E342E] shadow-xs">
                  <Terminal className="h-4 w-4 text-[#CC5500] shrink-0" />
                  <code className="font-bold">docker compose up -d</code>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#4E342E]/86 backdrop-blur-2xl border border-white/20 text-center flex flex-col items-center justify-center gap-2.5 shadow-[0_12px_32px_rgba(78,52,46,0.25),inset_0_1px_1px_rgba(255,255,255,0.25)]">
            <div className="bg-[#F8F4E7]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-sm border border-white/70 flex items-center">
              <Image
                src="/pravah-logo.png"
                alt="PRAVAH"
                width={104}
                height={30}
                className="h-6.5 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-[#F8F4E7]/80 font-medium">
              PRAVAH Urban Mobility Platform · Production v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
