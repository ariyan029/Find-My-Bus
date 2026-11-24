"use client";

import * as React from "react";
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
      {/* ─── Top Header Banner ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-[#4E342E]/12 shadow-[0_4px_20px_-4px_rgba(78,52,46,0.04)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-[#4E342E]">Commuter ID & Telemetry Console</h1>
            <Badge variant="success" className="text-[10px] py-0 px-1.5 h-4 font-semibold">
              Verified Contributor
            </Badge>
          </div>
          <p className="text-xs text-[#7E655D] mt-0.5">
            Manage your crowdsourced GPS contribution profile and database service telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4E342E]/6 border border-[#4E342E]/10 text-xs text-[#4E342E] font-medium">
            <Cpu className="h-3.5 w-3.5 text-[#CC5500]" />
            <span>Node v24 · PostGIS 16</span>
          </div>
        </div>
      </div>

      {/* ─── Responsive Grid (Desktop: 2 Columns / Mobile: Stacked) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Column (5 cols): Commuter Profile & Settings */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Profile Identity Card */}
          <Card className="border-[#4E342E]/14 bg-white/80 backdrop-blur-xl shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-[#CC5500]/30 shadow-md">
                <AvatarFallback className="bg-[#4E342E] text-[#F8F4E7] font-black text-lg">
                  PK
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#4E342E]">Kolkata Commuter</h2>
                  <Badge variant="outline" className="text-[10px] border-[#CC5500]/30 text-[#CC5500] bg-[#CC5500]/8 font-bold">
                    ID #8492
                  </Badge>
                </div>
                <p className="text-xs text-[#7E655D] mt-0.5">PRAVAH Community Telemetry Contributor</p>
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#CC5500] font-semibold">
                  <Award className="h-3.5 w-3.5 text-[#CC5500]" />
                  <span>Level 3 · Regular Explorer (Top 5%)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metric Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <Card className="border-[#4E342E]/14 bg-white/70 backdrop-blur-md text-center p-3 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-[#7E655D] tracking-wider">Pings Shared</p>
              <p className="text-lg font-black text-[#4E342E] mt-1 font-mono tabular-nums">1,420</p>
            </Card>
            <Card className="border-[#4E342E]/14 bg-white/70 backdrop-blur-md text-center p-3 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-[#7E655D] tracking-wider">KM Logged</p>
              <p className="text-lg font-black text-[#CC5500] mt-1 font-mono tabular-nums">184.2</p>
            </Card>
            <Card className="border-[#4E342E]/14 bg-white/70 backdrop-blur-md text-center p-3 shadow-sm">
              <p className="text-[10px] uppercase font-bold text-[#7E655D] tracking-wider">Accuracy</p>
              <p className="text-lg font-black text-emerald-800 mt-1 font-mono tabular-nums">99.4%</p>
            </Card>
          </div>

          {/* Preferences & Toggles */}
          <Card className="border-[#4E342E]/14 bg-white/80 backdrop-blur-xl shadow-sm">
            <CardHeader className="p-4 pb-2 border-b border-[#4E342E]/8">
              <CardTitle className="text-xs font-black uppercase tracking-wider text-[#4E342E]">
                Crowdsource & Cache Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-[#4E342E]">Background GPS Contribution</h3>
                  <p className="text-[11px] text-[#7E655D]">Broadcasts anonymous pings while riding</p>
                </div>
                <Button
                  size="sm"
                  variant={bgTracking ? "default" : "outline"}
                  onClick={() => setBgTracking(!bgTracking)}
                  className="h-7 text-xs px-2.5 font-bold"
                >
                  {bgTracking ? "Enabled" : "Disabled"}
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
                  variant={autoOffline ? "default" : "outline"}
                  onClick={() => setAutoOffline(!autoOffline)}
                  className="h-7 text-xs px-2.5 font-bold"
                >
                  {autoOffline ? "Active" : "Off"}
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column (7 cols): Docker & PostgreSQL Infrastructure Console */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-[#4E342E]/14 bg-white/80 backdrop-blur-xl shadow-sm">
            <CardHeader className="p-4 pb-3 border-b border-[#4E342E]/8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase font-black tracking-wider text-[#4E342E] flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-[#CC5500]" />
                  PostgreSQL & PostGIS Docker Architecture
                </CardTitle>
                <Badge variant="outline" className="text-[10px] border-[#CC5500]/30 text-[#CC5500] bg-[#CC5500]/8 font-bold">
                  Port 5432
                </Badge>
              </div>
              <CardDescription className="text-xs text-[#7E655D]">
                Persistent relational datastore with spatial GiST indexing and Prisma connection pooling
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="p-3.5 rounded-xl bg-[#4E342E] text-[#F8F4E7] space-y-2 font-mono text-xs shadow-inner">
                <div className="flex justify-between border-b border-[#F8F4E7]/10 pb-1">
                  <span className="text-[#F8F4E7]/60">Docker Image:</span>
                  <span className="text-[#F8F4E7] font-bold">postgis/postgis:16-3.4-alpine</span>
                </div>
                <div className="flex justify-between border-b border-[#F8F4E7]/10 pb-1">
                  <span className="text-[#F8F4E7]/60">TCP Port:</span>
                  <span className="text-[#CC5500] font-black">5432</span>
                </div>
                <div className="flex justify-between border-b border-[#F8F4E7]/10 pb-1">
                  <span className="text-[#F8F4E7]/60">Database:</span>
                  <span className="text-[#F8F4E7] font-bold">findmybus</span>
                </div>
                <div className="flex justify-between border-b border-[#F8F4E7]/10 pb-1">
                  <span className="text-[#F8F4E7]/60">Adapter:</span>
                  <span className="text-emerald-400 font-bold">@prisma/adapter-pg + pg.Pool</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#F8F4E7]/60">Resilience Mode:</span>
                  <span className="text-emerald-400 font-bold">Zero-Downtime Fallback Active</span>
                </div>
              </div>

              <div className="space-y-1 text-xs text-[#7E655D] pt-1">
                <span className="font-bold text-[#4E342E] block">To launch the local Docker container:</span>
                <div className="flex items-center gap-2 bg-[#4E342E]/8 p-2.5 rounded-xl border border-[#4E342E]/14 font-mono text-[11px] text-[#4E342E]">
                  <Terminal className="h-3.5 w-3.5 text-[#CC5500] shrink-0" />
                  <code className="font-bold">docker compose up -d</code>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-4 rounded-2xl bg-white/60 border border-[#4E342E]/10 text-center">
            <p className="text-xs text-[#7E655D] font-medium">PRAVAH Urban Mobility Platform · Production v1.0.0</p>
          </div>
        </div>

      </div>
    </div>
  );
}
