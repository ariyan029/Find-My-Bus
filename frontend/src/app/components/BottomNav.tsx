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
    <nav className="shrink-0 w-full bg-[#121217]/95 backdrop-blur-md border-t border-[#272732] py-2 px-4 z-50">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-lg transition-all",
                isActive
                  ? "text-blue-400 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <div
                className={cn(
                  "p-1 rounded-md transition-colors",
                  isActive ? "bg-blue-600/15 text-blue-400" : "text-zinc-400"
                )}
              >
                <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
              </div>
              <span className="text-[11px] tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
