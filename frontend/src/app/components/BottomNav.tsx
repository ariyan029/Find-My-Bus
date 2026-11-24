"use client";

import { Home, Compass, Bookmark, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Live Tracker", href: "/", icon: Home },
    { name: "Routes & Search", href: "/search", icon: Compass },
    { name: "Saved Hubs", href: "/saved", icon: Bookmark },
    { name: "Commuter ID", href: "/profile", icon: User },
  ];

  return (
    <nav className="shrink-0 w-full bg-[#F8F4E7]/90 backdrop-blur-xl border-t border-[#4E342E]/12 py-2 px-3 z-50 shadow-[0_-4px_20px_rgba(78,52,46,0.04)]">
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
                  : "text-[#4E342E]/65 hover:text-[#4E342E] hover:bg-[#4E342E]/5"
              )}
            >
              {isActive && (
                <span className="absolute -top-2 w-6 h-0.5 rounded-full bg-[#CC5500]" />
              )}
              <div
                className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-[#CC5500]/12 text-[#CC5500] shadow-sm"
                    : "text-[#4E342E]/70 group-hover:text-[#4E342E]"
                )}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 1.9} />
              </div>
              <span className="text-[11px] tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
