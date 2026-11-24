"use client";

import { Bus, Compass, Bookmark, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Live Tracker", href: "/", icon: Bus },
    { name: "Routes & Search", href: "/search", icon: Compass },
    { name: "Saved Hubs", href: "/saved", icon: Bookmark },
    { name: "Commuter ID", href: "/profile", icon: User },
  ];

  return (
    <nav className="shrink-0 w-full bg-[#4E342E]/86 backdrop-blur-2xl border-t border-white/20 py-2 px-3 z-50 shadow-[0_-8px_32px_0_rgba(78,52,46,0.3),inset_0_1px_1px_0_rgba(255,255,255,0.25)]">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all duration-200 relative group",
                isActive
                  ? "text-[#CC5500] font-bold"
                  : "text-[#F8F4E7]/70 hover:text-white"
              )}
            >
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 rounded-full bg-[#CC5500] shadow-[0_0_10px_#CC5500]" />
              )}
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-[#CC5500] text-white border border-white/35 shadow-[0_4px_14px_rgba(204,85,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.45)] scale-105"
                    : "text-[#F8F4E7]/80 group-hover:text-white group-hover:bg-white/10"
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[10px] tracking-tight font-medium",
                isActive ? "text-[#CC5500] font-bold" : "text-[#F8F4E7]/80"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
