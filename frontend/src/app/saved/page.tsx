"use client";

import { Bookmark, Star, Clock, MapPin } from "lucide-react";

export default function SavedPage() {
  return (
    <div className="relative h-full w-full flex flex-col bg-[var(--color-surface)] px-5 pt-12 pb-4 overflow-y-auto">
      <header className="mb-6">
        <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.12em]">Favorites & Recents</p>
        <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] tracking-tight mt-0.5">Saved Places & Routes</h1>
      </header>

      {/* Saved Stops */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Star size={16} className="text-amber-400" />
          <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">Favorite Stops</h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { name: "Esplanade Bus Terminus", desc: "Central Hub · 18 connecting routes" },
            { name: "Ultadanga Hudco Crossing", desc: "North Kolkata Hub · 24 connecting routes" },
            { name: "Ruby Hospital Crossing", desc: "EM Bypass Corridor · 14 connecting routes" },
          ].map((stop, idx) => (
            <div
              key={idx}
              className="glass-light border border-white/[0.06] rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer hover:border-amber-500/20 transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-600/10 flex items-center justify-center shrink-0">
                <MapPin size={16} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-[var(--color-text-primary)]">{stop.name}</h3>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{stop.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trips */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-emerald-400" />
          <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">Recent Searches</h2>
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { query: "Howrah to Salt Lake Sector V", time: "2 hours ago" },
            { query: "AC-39 Airport schedule", time: "Yesterday" },
            { query: "Gariahat to Shyambazar", time: "3 days ago" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-light border border-white/[0.06] rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-emerald-500/20 transition-all"
            >
              <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">{item.query}</span>
              <span className="text-[11px] text-[var(--color-text-muted)]">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
