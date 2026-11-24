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
    <header className="sticky top-0 z-40 w-full border-b border-[#CC5500]/30 bg-[#4E342E]/96 backdrop-blur-xl transition-all shadow-[0_4px_20px_rgba(78,52,46,0.35)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Identity Anchor (Chocolate + Cream + Burnt Orange) */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-[#F8F4E7] px-2.5 py-1 rounded-xl shadow-sm border border-white/70 flex items-center group-hover:shadow-[0_0_12px_rgba(204,85,0,0.4)] transition-all">
            <Image
              src="/pravah-logo.png"
              alt="PRAVAH"
              width={124}
              height={36}
              className="h-7 sm:h-7.5 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              priority
            />
          </div>
          <div className="hidden sm:flex flex-col justify-center border-l border-[#F8F4E7]/20 pl-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-black tracking-widest bg-[#CC5500] text-[#F8F4E7] px-2 py-0.5 rounded-md shadow-sm">
                Kolkata
              </span>
            </div>
            <p className="text-[10px] text-[#F8F4E7]/75 font-medium tracking-tight mt-0.5">Real-Time Transit Network</p>
          </div>
        </Link>

        {/* Desktop Navigation Links (Chocolate Capsule + Burnt Orange Active + Cream Text) */}
        <nav className="hidden md:flex items-center gap-1.5 bg-[#3D2823] p-1.5 rounded-2xl border border-[#CC5500]/25 shadow-inner">
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
                    ? "bg-[#CC5500] text-white shadow-[0_2px_12px_rgba(204,85,0,0.5)] font-bold scale-[1.02]"
                    : "text-[#F8F4E7]/80 hover:text-white hover:bg-white/10"
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
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-[#CC5500]/20 border border-[#CC5500]/40 text-[#F8F4E7] text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#CC5500] animate-ping" />
            <span className="text-[#F8F4E7] font-medium">Telemetry Live</span>
          </div>

          <Link href="/profile">
            <Button size="sm" className="h-8.5 px-3.5 text-xs font-bold bg-[#CC5500] hover:bg-[#B34700] text-white border-0 shadow-[0_2px_12px_rgba(204,85,0,0.4)] gap-1.5 transition-transform active:scale-95">
              <User className="h-3.5 w-3.5 text-white" />
              <span className="hidden sm:inline">Commuter ID</span>
            </Button>
          </Link>
        </div>

      </div>
    </header>
  );
}
