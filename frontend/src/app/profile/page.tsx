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
    <div className="flex-1 flex flex-col bg-[#09090b] text-zinc-100 p-4 space-y-4">
      {/* ─── Profile Header ─── */}
      <Card className="border-[#272732] bg-gradient-to-b from-[#181822] to-[#121217]">
        <CardContent className="p-4 flex items-center gap-3.5">
          <Avatar className="h-14 w-14 border border-blue-500/40">
            <AvatarFallback className="bg-blue-600/20 text-blue-400 font-bold text-base">
              CC
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">Kolkata Commuter</h1>
              <Badge variant="success" className="text-[10px] py-0 px-1.5 h-4">
                Verified
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">Crowdsourced Transit Contributor</p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-blue-400">
              <Award className="h-3.5 w-3.5" />
              <span>Level 3 · Regular Explorer</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Contribution Metrics ─── */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-[#272732] bg-[#121217] text-center p-3">
          <p className="text-[10px] uppercase font-bold text-zinc-400">Pings Sent</p>
          <p className="text-lg font-bold text-white mt-1 font-mono">1,420</p>
        </Card>
        <Card className="border-[#272732] bg-[#121217] text-center p-3">
          <p className="text-[10px] uppercase font-bold text-zinc-400">KM Tracked</p>
          <p className="text-lg font-bold text-blue-400 mt-1 font-mono">184.2</p>
        </Card>
        <Card className="border-[#272732] bg-[#121217] text-center p-3">
          <p className="text-[10px] uppercase font-bold text-zinc-400">Accuracy</p>
          <p className="text-lg font-bold text-emerald-400 mt-1 font-mono">99.4%</p>
        </Card>
      </div>

      {/* ─── Database & Docker Infrastructure Status ─── */}
      <Card className="border-[#272732] bg-[#121217]">
        <CardHeader className="pb-2.5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-blue-400" />
              Database & Docker Infrastructure
            </CardTitle>
            <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
              PostgreSQL
            </Badge>
          </div>
          <CardDescription className="text-xs text-zinc-400">
            Real-time geospatial storage with PostGIS extension
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2 text-xs">
          <div className="p-2.5 rounded-lg bg-[#0d0d12] border border-[#272732] space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">Service:</span>
              <span className="text-zinc-200">postgres:16-postgis</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Port:</span>
              <span className="text-blue-400">5432</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Database:</span>
              <span className="text-zinc-200">findmybus</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Prisma Client:</span>
              <span className="text-emerald-400">Configured & Resilient</span>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 pt-1">
            To start the container anytime on your machine:
            <code className="block bg-[#181822] text-zinc-200 p-2 rounded mt-1 border border-[#272732] font-mono">
              docker compose up -d
            </code>
          </div>
        </CardContent>
      </Card>

      {/* ─── App Settings ─── */}
      <Card className="border-[#272732] bg-[#121217]">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-semibold text-white">Background GPS Contribution</h3>
              <p className="text-[11px] text-zinc-400">Broadcasts anonymous pings while riding</p>
            </div>
            <Button
              size="sm"
              variant={bgTracking ? "default" : "outline"}
              onClick={() => setBgTracking(!bgTracking)}
              className="h-7 text-xs px-2.5"
            >
              {bgTracking ? "Enabled" : "Disabled"}
            </Button>
          </div>

          <Separator className="bg-[#272732]" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-semibold text-white">Offline Route Cache</h3>
              <p className="text-[11px] text-zinc-400">Preload Kolkata bus stops for low-network zones</p>
            </div>
            <Button
              size="sm"
              variant={autoOffline ? "default" : "outline"}
              onClick={() => setAutoOffline(!autoOffline)}
              className="h-7 text-xs px-2.5"
            >
              {autoOffline ? "Active" : "Off"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center py-2">
        <p className="text-[11px] text-zinc-500">Where is my Bus (Kolkata) · Production v0.2.0</p>
      </div>
    </div>
  );
}
