"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, Radio, Compass, Bookmark, User, Activity, Sparkles, Navigation } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Live Tracker", href: "/", icon: Bus },
    { name: "Routes & Search", href: "/search", icon: Compass },
    { name: "Saved Hubs", href: "/saved", icon: Bookmark },
    { name: "Commuter ID", href: "/profile", icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#4E342E]/12 bg-[#F8F4E7]/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        
        {/* Brand & Identity */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#CC5500]/12 border border-[#CC5500]/30 flex items-center justify-center shadow-sm group-hover:bg-[#CC5500]/20 transition-colors">
            <Bus className="h-4 w-4 text-[#CC5500]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-wider text-[#4E342E]">PRAVAH</span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-[#CC5500]/35 text-[#CC5500] font-semibold bg-[#CC5500]/8">
                Kolkata
              </Badge>
            </div>
            <p className="text-[10px] text-[#7E655D] font-medium hidden sm:block tracking-tight">Real-Time Transit Network</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#4E342E]/6 p-1 rounded-2xl border border-[#4E342E]/10">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200",
                  isActive
                    ? "bg-white text-[#CC5500] shadow-sm font-bold"
                    : "text-[#4E342E]/70 hover:text-[#4E342E] hover:bg-white/50"
                )}
              >
                <Icon size={14} className={isActive ? "text-[#CC5500]" : "text-[#4E342E]/60"} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status & Live Telemetry Pill */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-800 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            <span>Telemetry Live</span>
          </div>

          <Link href="/profile">
            <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs font-bold border-[#4E342E]/18 gap-1.5">
              <User className="h-3.5 w-3.5 text-[#CC5500]" />
              <span className="hidden sm:inline">Commuter</span>
            </Button>
          </Link>
        </div>

      </div>
    </header>
  );
}
