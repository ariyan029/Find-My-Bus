"use client";

import { MapPin, Search, BusFront, ArrowRight, Navigation, Clock, Star, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative h-full w-full flex flex-col bg-[var(--color-surface)]">

      {/* ─── Map Area ─── */}
      <div className="relative h-[38%] shrink-0 bg-map-pattern overflow-hidden">
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-surface)] via-transparent to-transparent opacity-80 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent z-10" />
        
        {/* Floating Status Bar */}
        <header className="relative z-20 flex justify-between items-center px-5 pt-12 pb-4">
          <div>
            <p className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-[0.12em]">Your location</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              <h1 className="text-[16px] font-bold text-[var(--color-text-primary)] tracking-tight">Kolkata, WB</h1>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl glass border border-white/[0.08] flex items-center justify-center cursor-pointer hover:border-brand-500/30 transition-colors active:scale-95">
            <Navigation size={16} className="text-[var(--color-text-secondary)]" strokeWidth={2} />
          </div>
        </header>

        {/* Center Location Marker */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* Ripple ring */}
            <div className="absolute top-1/2 left-1/2 w-[90px] h-[90px] rounded-full border border-brand-500/20 animate-ripple" />
            <div className="absolute top-1/2 left-1/2 w-[90px] h-[90px] rounded-full border border-brand-500/10 animate-ripple" style={{ animationDelay: "1s" }} />
            {/* Marker */}
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 border-[3px] border-[var(--color-surface)] shadow-[0_0_24px_rgba(99,102,241,0.35)] flex items-center justify-center animate-pulse-glow">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Content Panel ─── */}
      <div className="flex-1 min-h-0 flex flex-col bg-[var(--color-surface)] relative z-20">
        {/* Curved top edge for premium feel */}
        <div className="absolute -top-5 left-0 right-0 h-6 bg-[var(--color-surface)] rounded-t-[28px] z-10" />
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto relative z-20 px-5 pt-2 pb-4">
          
          {/* Search Bar */}
          <div className="animate-slide-up">
            <div className="glass-light border border-white/[0.08] rounded-2xl p-3.5 flex items-center gap-3 cursor-text hover:border-brand-500/20 transition-all duration-300 group">
              <div className="w-9 h-9 rounded-xl bg-brand-600/10 flex items-center justify-center shrink-0">
                <Search size={16} className="text-brand-400" strokeWidth={2.5} />
              </div>
              <input
                type="text"
                placeholder="Where are you going?"
                className="flex-1 bg-transparent text-[15px] font-semibold text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shrink-0 opacity-0 group-focus-within:opacity-100 transition-opacity">
                <ArrowRight size={14} className="text-white" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2.5 mt-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="glass-light border border-white/[0.06] rounded-2xl p-3.5 flex flex-col items-center gap-2 cursor-pointer hover:border-brand-500/20 hover:bg-brand-600/5 transition-all duration-300 active:scale-[0.97] group">
              <div className="w-10 h-10 rounded-xl bg-brand-600/10 flex items-center justify-center group-hover:bg-brand-600/20 transition-colors">
                <BusFront size={18} className="text-brand-400" strokeWidth={2} />
              </div>
              <span className="text-[12px] font-bold text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">Routes</span>
            </div>
            <div className="glass-light border border-white/[0.06] rounded-2xl p-3.5 flex flex-col items-center gap-2 cursor-pointer hover:border-amber-500/20 hover:bg-amber-600/5 transition-all duration-300 active:scale-[0.97] group">
              <div className="w-10 h-10 rounded-xl bg-amber-600/10 flex items-center justify-center group-hover:bg-amber-600/20 transition-colors">
                <Star size={18} className="text-amber-400" strokeWidth={2} />
              </div>
              <span className="text-[12px] font-bold text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">Saved</span>
            </div>
            <div className="glass-light border border-white/[0.06] rounded-2xl p-3.5 flex flex-col items-center gap-2 cursor-pointer hover:border-emerald-500/20 hover:bg-emerald-600/5 transition-all duration-300 active:scale-[0.97] group">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center group-hover:bg-emerald-600/20 transition-colors">
                <Clock size={18} className="text-emerald-400" strokeWidth={2} />
              </div>
              <span className="text-[12px] font-bold text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">Recent</span>
            </div>
          </div>

          {/* Section Divider */}
          <div className="flex items-center gap-3 mt-6 mb-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-[14px] font-bold text-[var(--color-text-primary)] tracking-tight">Nearby Stops</h2>
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] font-semibold text-brand-400 cursor-pointer hover:text-brand-300 transition-colors">View all</span>
          </div>

          {/* Nearby Stops List */}
          <div className="flex flex-col gap-2 animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
            {[
              { name: "Esplanade Tram Depot", distance: "200m", routes: ["S-12", "AC-39", "C-11"], active: 3 },
              { name: "Park Street Crossing", distance: "450m", routes: ["S-9", "C-14"], active: 2 },
              { name: "Howrah Bridge Stop", distance: "1.2km", routes: ["S-5", "AC-20", "C-7", "S-32"], active: 5 },
            ].map((stop, idx) => (
              <div
                key={idx}
                className="glass-light border border-white/[0.06] rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-brand-500/15 hover:bg-brand-600/[0.03] transition-all duration-300 active:scale-[0.98] group"
              >
                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-brand-600/8 border border-brand-500/10 flex items-center justify-center shrink-0 group-hover:bg-brand-600/15 transition-colors">
                  <MapPin size={18} className="text-brand-400" strokeWidth={2} />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-bold text-[var(--color-text-primary)] truncate">{stop.name}</h3>
                    <ChevronRight size={14} className="text-[var(--color-text-muted)] group-hover:text-brand-400 transition-colors shrink-0 ml-2" strokeWidth={2.5} />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[12px] font-semibold text-[var(--color-text-muted)]">{stop.distance}</span>
                    <span className="text-[var(--color-text-muted)]">·</span>
                    <span className="text-[12px] font-semibold text-[var(--color-success)]">{stop.active} buses active</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {stop.routes.map(r => (
                      <span key={r} className="px-2 py-0.5 bg-white/[0.04] text-[var(--color-text-secondary)] text-[11px] font-bold rounded-md border border-white/[0.06]">{r}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Live Activity Banner */}
          <div className="mt-5 mb-2 animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-700/20 via-brand-600/10 to-brand-700/20 border border-brand-500/15 p-4">
              {/* Subtle shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent translate-x-[-100%] animate-[shimmer_3s_infinite]" />
              
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center shrink-0">
                  <BusFront size={18} className="text-brand-400" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-[var(--color-text-primary)]">14 buses are active nearby</p>
                  <p className="text-[11px] font-semibold text-[var(--color-text-muted)] mt-0.5">Live tracking from 6 contributors</p>
                </div>
                <div className="flex -space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" style={{ animationDelay: "0.5s" }} />
                  <div className="w-2 h-2 rounded-full bg-[var(--color-warning)] animate-pulse" style={{ animationDelay: "1s" }} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
