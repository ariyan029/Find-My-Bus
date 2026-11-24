import type { Metadata, Viewport } from "next";
import Image from "next/image";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "./components/BottomNav";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "PRAVAH - Real-Time Kolkata Transit Network",
  description: "Live crowdsourced Kolkata bus tracking, dynamic ETAs, route schedules, and urban stop navigator powered by PRAVAH.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#4E342E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://tile.openstreetmap.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://server.arcgisonline.com" />
      </head>
      <body className="min-h-screen bg-[#F8F4E7] text-[#4E342E] flex flex-col font-sans selection:bg-[#CC5500] selection:text-white antialiased relative overflow-x-hidden">
        
        {/* ─── GPU-Friendly Ambient Glassmorphic Background Mesh (Zero Heavy Blur Filters) ─── */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden contain-strict">
          {/* Top-Right Vibrant Burnt Orange Glow */}
          <div className="absolute -top-44 -right-32 w-[720px] h-[720px] rounded-full bg-[radial-gradient(circle,rgba(204,85,0,0.20)_0%,rgba(204,85,0,0.08)_38%,transparent_70%)]" />
          
          {/* Center-Left Deep Chocolate Brown Ambient Glow */}
          <div className="absolute top-[22%] -left-44 w-[780px] h-[780px] rounded-full bg-[radial-gradient(circle,rgba(78,52,46,0.16)_0%,rgba(78,52,46,0.06)_40%,transparent_70%)]" />
          
          {/* Center-Right Warm Transit Radar Glow */}
          <div className="absolute top-[45%] -right-36 w-[680px] h-[680px] rounded-full bg-[radial-gradient(circle,rgba(204,85,0,0.14)_0%,rgba(204,85,0,0.05)_40%,transparent_70%)]" />
          
          {/* Bottom-Center Chocolate & Cream Foundation Glow */}
          <div className="absolute -bottom-48 left-[12%] w-[860px] h-[860px] rounded-full bg-[radial-gradient(circle,rgba(78,52,46,0.14)_0%,rgba(78,52,46,0.05)_40%,transparent_70%)]" />

          {/* Concentric Spatial Radar Ripples */}
          <div className="absolute top-16 right-[18%] w-[480px] h-[480px] rounded-full border border-[#CC5500]/14" />
          <div className="absolute top-8 right-[15%] w-[640px] h-[640px] rounded-full border border-[#CC5500]/8" />
          <div className="absolute top-[32%] left-[8%] w-[420px] h-[420px] rounded-full border border-[#4E342E]/10" />

          {/* Micro Transit Grid Matrix Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#4E342E_1.2px,transparent_1.2px)] [background-size:26px_26px] opacity-[0.08]" />
        </div>
        
        {/* Responsive Frosted Glass Navigation */}
        <Navbar />

        {/* Responsive Content Shell on Translucent Canvas */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 z-10 pb-24 md:pb-8 flex flex-col">
          {children}
        </main>

        {/* Desktop / Tablet Frosted Glass Footer */}
        <footer className="hidden md:block w-full border-t border-white/40 bg-[#4E342E]/90 backdrop-blur-2xl text-[#F8F4E7] py-5 mt-auto z-10 shadow-[0_-8px_32px_rgba(78,52,46,0.18)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="bg-[#F8F4E7]/90 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center shadow-sm border border-white/70">
                <Image
                  src="/pravah-logo.png"
                  alt="PRAVAH"
                  width={82}
                  height={24}
                  className="h-4.5 w-auto object-contain"
                />
              </div>
              <span className="text-[#F8F4E7]/30">|</span>
              <span className="text-[#F8F4E7]/85 font-medium">Kolkata Urban Mobility & Spatial Telemetry Network</span>
            </div>
            
            <div className="flex items-center gap-4 text-[11px] font-medium">
              <span className="text-[#F8F4E7]/70">Production v1.0.0</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#CC5500] animate-pulse" />
              <span className="text-[#CC5500] font-bold">Telemetry Live & Connected</span>
            </div>
          </div>
        </footer>

        {/* Mobile Navigation Bar (hidden on tablet/desktop) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <BottomNav />
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
