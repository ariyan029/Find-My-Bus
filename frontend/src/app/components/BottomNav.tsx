"use client";

import { Home, Search, Bookmark, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  
  const navItems = [
    { name: "Explore", href: "/", icon: Home },
    { name: "Routes", href: "/search", icon: Search },
    { name: "Saved", href: "/saved", icon: Bookmark },
    { name: "Account", href: "/profile", icon: User },
  ];

  return (
    <div className="shrink-0 w-full glass border-t border-white/[0.06] pt-2.5 pb-5 z-50 relative">
      <div className="flex justify-around items-center px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center gap-1 w-16 group relative"
            >
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -top-2.5 w-5 h-0.5 rounded-full bg-brand-500" />
              )}
              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={`transition-all duration-200 ${
                  isActive
                    ? "text-brand-400"
                    : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
                }`}
              />
              <span
                className={`text-[10px] font-bold tracking-wide transition-colors duration-200 ${
                  isActive
                    ? "text-brand-400"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
