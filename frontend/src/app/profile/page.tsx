"use client";

import * as React from "react";
import Image from "next/image";
import {
  User,
  Radio,
  Database,
  Shield,
  Award,
  CheckCircle2,
  Server,
  Layers,
  Activity,
  Sparkles,
  Terminal,
  Cpu,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const [bgTracking, setBgTracking] = React.useState<boolean>(true);
  const [autoOffline, setAutoOffline] = React.useState<boolean>(true);

  return (
    <div className="flex-1 flex flex-col space-y-5">
      
      {/* ─── Top Header Banner (35% Chocolate Anchor + 25% Burnt Orange Energy) ─── */}
      <div className="surface-chocolate-hero p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black tracking-tight text-[#F8F4E7]">Commuter ID & Telemetry Console</h1>
            <Badge className="bg-[#CC5500] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 border-0 shadow-sm">
              Verified Contributor
            </Badge>
          </div>
          <p className="text-xs text-[#F8F4E7]/80 mt-1 max-w-xl leading-relaxed">
            Manage your crowdsourced GPS contribution telemetry and inspect backend database services
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#CC5500]/25 border border-[#CC5500]/45 text-[#F8F4E7] text-xs font-bold shadow-inner">
            <Cpu className="h-4 w-4 text-[#CC5500]" />
            <span>Node v24 · PostGIS 16</span>
          </div>
        </div>
      </div>

      {/* ─── Responsive Grid (Desktop: 2 Columns / Mobile: Stacked) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (5 cols): Commuter Profile & Settings */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Profile Identity Card (Rich Chocolate Brown with Burnt Orange accents) */}
          <div className="rounded-2xl border border-[#CC5500]/30 bg-[#4E342E] text-[#F8F4E7] p-5 shadow-[0_12px_36px_-10px_rgba(78,52,46,0.35)] flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-[#CC5500] shadow-md ring-4 ring-[#CC5500]/20">
              <AvatarFallback className="bg-[#CC5500] text-white font-black text-xl">
                PK
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Kolkata Commuter</h2>
                <span className="bg-[#CC5500] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-xs">
                  ID #8492
                </span>
              </div>
              <p className="text-xs text-[#F8F4E7]/75">PRAVAH Community Telemetry Contributor</p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-[#CC5500] font-bold bg-[#3A241F] px-2.5 py-0.5 rounded-md border border-[#CC5500]/30 w-fit">
                <Award className="h-3.5 w-3.5 text-[#CC5500]" />
                <span>Level 3 · Regular Explorer (Top 5%)</span>
              </div>
            </div>
          </div>

          {/* Metric Cards (Balanced Cream & Chocolate surfaces) */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-[#4E342E]/16 bg-white/85 p-3 text-center shadow-sm">
              <p className="text-[10px] uppercase font-bold text-[#7E655D] tracking-wider">Pings Shared</p>
              <p className="text-lg font-black text-[#4E342E] mt-1 font-mono tabular-nums">1,420</p>
            </div>
            <div className="rounded-xl border border-[#CC5500]/40 bg-[#4E342E] text-[#F8F4E7] p-3 text-center shadow-md">
              <p className="text-[10px] uppercase font-bold text-[#F8F4E7]/70 tracking-wider">KM Logged</p>
              <p className="text-lg font-black text-[#CC5500] mt-1 font-mono tabular-nums">184.2</p>
            </div>
            <div className="rounded-xl border border-[#4E342E]/16 bg-white/85 p-3 text-center shadow-sm">
              <p className="text-[10px] uppercase font-bold text-[#7E655D] tracking-wider">Accuracy</p>
              <p className="text-lg font-black text-emerald-800 mt-1 font-mono tabular-nums">99.4%</p>
            </div>
          </div>

          {/* Preferences & Toggles */}
          <div className="rounded-2xl overflow-hidden border border-[#4E342E]/20 bg-white/85 backdrop-blur-xl shadow-sm">
            <div className="bg-[#4E342E] text-[#F8F4E7] p-3.5 px-4 border-b border-[#CC5500]/30 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#F8F4E7]">
                Crowdsource & Cache Preferences
              </span>
              <span className="text-[10px] text-[#F8F4E7]/70 font-mono">Settings</span>
            </div>
            
            <div className="p-4 space-y-3.5 bg-[#F8F4E7]/80">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-[#4E342E]">Background GPS Contribution</h3>
                  <p className="text-[11px] text-[#7E655D]">Broadcasts anonymous pings while riding</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setBgTracking(!bgTracking)}
                  className={`h-7.5 text-xs px-3 font-bold rounded-lg ${
                    bgTracking 
                      ? "bg-[#CC5500] hover:bg-[#B34700] text-white shadow-xs" 
                      : "border border-[#4E342E]/25 bg-white text-[#4E342E]"
                  }`}
                >
                  {bgTracking ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <Separator className="bg-[#4E342E]/12" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-[#4E342E]">Offline Route Preloading</h3>
                  <p className="text-[11px] text-[#7E655D]">Caches Kolkata bus stops for low-network zones</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setAutoOffline(!autoOffline)}
                  className={`h-7.5 text-xs px-3 font-bold rounded-lg ${
                    autoOffline 
                      ? "bg-[#CC5500] hover:bg-[#B34700] text-white shadow-xs" 
                      : "border border-[#4E342E]/25 bg-white text-[#4E342E]"
                  }`}
                >
                  {autoOffline ? "Active" : "Off"}
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (7 cols): Docker & PostgreSQL Infrastructure Console */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-[#4E342E]/20 bg-white/85 backdrop-blur-xl shadow-[0_10px_30px_-8px_rgba(78,52,46,0.12)]">
            <div className="bg-[#4E342E] text-[#F8F4E7] p-4 pb-3.5 border-b border-[#CC5500]/30 flex items-center justify-between">
              <div>
                <h3 className="text-xs uppercase font-black tracking-wider text-[#F8F4E7] flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#CC5500]" />
                  PostgreSQL & PostGIS Docker Architecture
                </h3>
                <p className="text-xs text-[#F8F4E7]/70 mt-0.5">
                  Spatial GiST indexing with Prisma connection pooling
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-white bg-[#CC5500] px-2 py-0.5 rounded-md shadow-xs">
                Port 5432
              </span>
            </div>

            <div className="p-4.5 space-y-3.5 bg-[#F8F4E7]/80">
              <div className="p-4 rounded-xl bg-[#2A1D19] text-[#F8F4E7] space-y-2.5 font-mono text-xs shadow-inner border border-[#CC5500]/25">
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[#F8F4E7]/60">Docker Image:</span>
                  <span className="text-[#F8F4E7] font-bold">postgis/postgis:16-3.4-alpine</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[#F8F4E7]/60">TCP Port:</span>
                  <span className="text-[#CC5500] font-black">5432</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[#F8F4E7]/60">Database:</span>
                  <span className="text-[#F8F4E7] font-bold">findmybus</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-[#F8F4E7]/60">Adapter:</span>
                  <span className="text-emerald-400 font-bold">@prisma/adapter-pg + pg.Pool</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#F8F4E7]/60">Resilience Mode:</span>
                  <span className="text-emerald-400 font-bold">Zero-Downtime Fallback Active</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-[#7E655D] pt-1">
                <span className="font-bold text-[#4E342E] block">To launch the local Docker container:</span>
                <div className="flex items-center gap-2 bg-[#4E342E]/10 p-3 rounded-xl border border-[#4E342E]/16 font-mono text-[11px] text-[#4E342E]">
                  <Terminal className="h-4 w-4 text-[#CC5500] shrink-0" />
                  <code className="font-bold">docker compose up -d</code>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#4E342E] border border-[#CC5500]/30 text-center flex flex-col items-center justify-center gap-2.5 shadow-md">
            <div className="bg-[#F8F4E7] px-3 py-1 rounded-xl shadow-sm flex items-center">
              <Image
                src="/pravah-logo.png"
                alt="PRAVAH"
                width={104}
                height={30}
                className="h-6 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-[#F8F4E7]/80 font-medium">PRAVAH Urban Mobility Platform · Production v1.0.0</p>
          </div>
        </div>

      </div>
    </div>
  );
}
