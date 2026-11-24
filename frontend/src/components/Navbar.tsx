"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bus, Compass, Bookmark, User, Radio, Sparkles } from "lucide-react";
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
    <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-[#4E342E]/82 backdrop-blur-2xl transition-all shadow-[0_8px_32px_0_rgba(78,52,46,0.24),inset_0_1px_1px_0_rgba(255,255,255,0.25)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Identity Anchor in Frosted Glass Capsule */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-[#F8F4E7]/85 backdrop-blur-xl px-2.5 py-1 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-white/80 flex items-center group-hover:scale-[1.02] group-hover:shadow-[0_0_16px_rgba(204,85,0,0.4)] transition-all">
            <Image
              src="/pravah-logo.png"
              alt="PRAVAH"
              width={124}
              height={36}
              className="h-7 sm:h-7.5 w-auto object-contain transition-transform"
              priority
            />
          </div>
          <div className="hidden sm:flex flex-col justify-center border-l border-white/20 pl-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-black tracking-widest bg-[#CC5500] text-white px-2 py-0.5 rounded-md shadow-sm border border-white/25">
                Kolkata
              </span>
            </div>
            <p className="text-[10px] text-[#F8F4E7]/80 font-medium tracking-tight mt-0.5">Real-Time Transit Network</p>
          </div>
        </Link>

        {/* Desktop Navigation Links in Frosted Dark Capsule */}
        <nav className="hidden md:flex items-center gap-1.5 bg-black/25 backdrop-blur-xl p-1.5 rounded-2xl border border-white/14 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
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
                    ? "bg-[#CC5500] text-white shadow-[0_4px_14px_rgba(204,85,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.45)] border border-white/30 font-bold scale-[1.02]"
                    : "text-[#F8F4E7]/80 hover:text-white hover:bg-white/10 hover:shadow-xs"
                )}
              >
                <Icon size={14} className={isActive ? "text-white" : "text-[#F8F4E7]/70"} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status Pill & Commuter Action */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-black/25 backdrop-blur-xl border border-white/15 text-[#F8F4E7] text-[11px] font-semibold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-[#CC5500] animate-ping" />
            <span className="text-[#F8F4E7] font-medium">Telemetry Live</span>
          </div>

          <Link href="/profile">
            <Button size="sm" className="h-8.5 px-3.5 text-xs font-bold bg-[#CC5500] hover:bg-[#B34700] text-white border border-white/35 shadow-[0_4px_16px_rgba(204,85,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] gap-1.5 transition-all active:scale-95 rounded-xl">
              <User className="h-3.5 w-3.5 text-white" />
              <span className="hidden sm:inline">Commuter ID</span>
            </Button>
          </Link>
        </div>

      </div>
    </header>
  );
}
