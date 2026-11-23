"use client";

import { Search, BusFront, ArrowRight } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="relative h-full w-full flex flex-col bg-[var(--color-surface)] px-5 pt-12 pb-4 overflow-y-auto">
      <header className="mb-6">
        <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.12em]">Search & Explore</p>
        <h1 className="text-[20px] font-bold text-[var(--color-text-primary)] tracking-tight mt-0.5">Find Bus Routes</h1>
      </header>

      {/* Origin - Destination Search Box */}
      <div className="glass-light border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shrink-0" />
          <input
            type="text"
            placeholder="Starting bus stop / landmark"
            className="flex-1 bg-transparent text-[14px] font-semibold text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />
        </div>
        <div className="h-px bg-white/[0.06] ml-5" />
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] shrink-0" />
          <input
            type="text"
            placeholder="Destination stop / area"
            className="flex-1 bg-transparent text-[14px] font-semibold text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
          />
        </div>
      </div>

      {/* Popular Routes */}
      <div className="mt-6">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)] mb-3">Popular Kolkata Routes</h2>
        <div className="flex flex-col gap-2.5">
          {[
            { route: "S-12", from: "Howrah Station", to: "New Town Shapoorji", frequency: "Every 8 mins" },
            { route: "AC-39", from: "Esplanade", to: "Airport Gate 1", frequency: "Every 12 mins" },
            { route: "C-11", from: "Salt Lake Sector V", to: "Tollygunge Karunamoyee", frequency: "Every 10 mins" },
            { route: "239B", from: "Barasat", to: "Babughat", frequency: "Every 15 mins" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-light border border-white/[0.06] rounded-2xl p-3.5 flex items-center justify-between cursor-pointer hover:border-brand-500/20 hover:bg-brand-600/[0.03] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600/10 border border-brand-500/15 flex items-center justify-center shrink-0">
                  <BusFront size={18} className="text-brand-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-[var(--color-text-primary)]">{item.route}</span>
                    <span className="text-[11px] text-[var(--color-text-muted)] font-medium">({item.frequency})</span>
                  </div>
                  <p className="text-[12px] text-[var(--color-text-secondary)] mt-0.5">{item.from} → {item.to}</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-[var(--color-text-muted)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
