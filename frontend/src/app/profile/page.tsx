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
    <div className="flex-1 flex flex-col bg-[#F8F4E7] text-[#4E342E] p-4 space-y-4">
      {/* ─── Profile Header ─── */}
      <Card className="border-[#4E342E]/14 bg-gradient-to-br from-white/90 via-[#F8F4E7]/80 to-white/75 backdrop-blur-xl shadow-sm">
        <CardContent className="p-4 flex items-center gap-3.5">
          <Avatar className="h-14 w-14 border-2 border-[#CC5500]/30 shadow-md">
            <AvatarFallback className="bg-[#4E342E] text-[#F8F4E7] font-bold text-base">
              CC
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#4E342E]">Kolkata Commuter</h1>
              <Badge variant="success" className="text-[10px] py-0 px-1.5 h-4 font-semibold">
                Verified
              </Badge>
            </div>
            <p className="text-xs text-[#7E655D] mt-0.5">Crowdsourced Transit Contributor</p>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#CC5500] font-semibold">
              <Award className="h-3.5 w-3.5 text-[#CC5500]" />
              <span>Level 3 · Regular Explorer</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Contribution Metrics ─── */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-[#4E342E]/14 bg-white/70 backdrop-blur-md text-center p-3 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-[#7E655D] tracking-wider">Pings Sent</p>
          <p className="text-lg font-black text-[#4E342E] mt-1 font-mono">1,420</p>
        </Card>
        <Card className="border-[#4E342E]/14 bg-white/70 backdrop-blur-md text-center p-3 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-[#7E655D] tracking-wider">KM Tracked</p>
          <p className="text-lg font-black text-[#CC5500] mt-1 font-mono">184.2</p>
        </Card>
        <Card className="border-[#4E342E]/14 bg-white/70 backdrop-blur-md text-center p-3 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-[#7E655D] tracking-wider">Accuracy</p>
          <p className="text-lg font-black text-emerald-800 mt-1 font-mono">99.4%</p>
        </Card>
      </div>

      {/* ─── Database & Docker Infrastructure Status ─── */}
      <Card className="border-[#4E342E]/14 bg-white/70 backdrop-blur-xl shadow-sm">
        <CardHeader className="pb-2.5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs uppercase font-bold tracking-wider text-[#4E342E] flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-[#CC5500]" />
              Database & Docker Infrastructure
            </CardTitle>
            <Badge variant="outline" className="text-[10px] border-[#CC5500]/30 text-[#CC5500] bg-[#CC5500]/8 font-semibold">
              PostgreSQL
            </Badge>
          </div>
          <CardDescription className="text-xs text-[#7E655D]">
            Real-time geospatial storage with PostGIS extension
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2.5 text-xs">
          <div className="p-3 rounded-xl bg-[#4E342E] text-[#F8F4E7] space-y-1.5 font-mono text-[11px] shadow-inner">
            <div className="flex justify-between">
              <span className="text-[#F8F4E7]/60">Service:</span>
              <span className="text-[#F8F4E7] font-semibold">postgis/postgis:16</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#F8F4E7]/60">Port:</span>
              <span className="text-[#CC5500] font-bold">5432</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#F8F4E7]/60">Database:</span>
              <span className="text-[#F8F4E7] font-semibold">findmybus</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#F8F4E7]/60">Prisma Client:</span>
              <span className="text-emerald-400 font-semibold">Configured & Resilient</span>
            </div>
          </div>

          <div className="text-[11px] text-[#7E655D] pt-1">
            To start the container anytime on your machine:
            <code className="block bg-[#4E342E]/8 text-[#4E342E] p-2.5 rounded-xl mt-1.5 border border-[#4E342E]/14 font-mono font-semibold">
              docker compose up -d
            </code>
          </div>
        </CardContent>
      </Card>

      {/* ─── App Settings ─── */}
      <Card className="border-[#4E342E]/14 bg-white/70 backdrop-blur-xl shadow-sm">
        <CardContent className="p-3.5 space-y-3">
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

          <Separator className="bg-[#4E342E]/12" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-[#4E342E]">Offline Route Cache</h3>
              <p className="text-[11px] text-[#7E655D]">Preload Kolkata bus stops for low-network zones</p>
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

      <div className="text-center py-2">
        <p className="text-[11px] text-[#7E655D] font-medium">Where is my Bus (Kolkata) · Urban Mobility v0.3.0</p>
      </div>
    </div>
  );
}
