"use client";

import { User, Shield, Radio, Bell, MapPin, Sparkles } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="relative h-full w-full flex flex-col bg-[var(--color-surface)] px-5 pt-12 pb-4 overflow-y-auto">
      <header className="mb-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
          <User size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-[18px] font-bold text-[var(--color-text-primary)] tracking-tight">Kolkata Commuter</h1>
          <p className="text-[12px] text-[var(--color-text-muted)] font-medium mt-0.5">Crowdsource Contributor</p>
        </div>
      </header>

      {/* Contributor Badge */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-600/15 via-brand-500/10 to-brand-700/15 border border-brand-500/20 p-4 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-brand-400" />
          <span className="text-[13px] font-bold text-[var(--color-text-primary)]">Community GPS Contributor</span>
        </div>
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          Sharing anonymous location updates when on-board helps thousands of Kolkata commuters see accurate live bus ETAs.
        </p>
      </div>

      {/* Settings Options */}
      <div className="flex flex-col gap-2">
        {[
          { icon: Radio, title: "Background GPS Tracking", subtitle: "Active while tracking a bus journey", toggle: true },
          { icon: Bell, title: "Bus Arrival Notifications", subtitle: "Alert 2 stops before destination", toggle: true },
          { icon: Shield, title: "Privacy & Data Anonymization", subtitle: "Your location is strictly anonymized", toggle: false },
          { icon: MapPin, title: "Offline Route Cache", subtitle: "Saved routes accessible without internet", toggle: true },
        ].map((item, idx) => (
          <div
            key={idx}
            className="glass-light border border-white/[0.06] rounded-2xl p-3.5 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                <item.icon size={16} className="text-brand-400" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold text-[var(--color-text-primary)]">{item.title}</h3>
                <p className="text-[11px] text-[var(--color-text-muted)]">{item.subtitle}</p>
              </div>
            </div>
            {item.toggle && (
              <div className="w-10 h-5 rounded-full bg-brand-600 flex items-center justify-end px-0.5">
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-[11px] text-[var(--color-text-muted)]">Where is my Bus (Kolkata) · v0.1.0 Alpha</p>
      </div>
    </div>
  );
}
