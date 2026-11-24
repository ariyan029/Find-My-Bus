import type { Metadata, Viewport } from "next";
import Image from "next/image";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "./components/BottomNav";

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
      <body className="min-h-screen bg-[#F8F4E7] text-[#4E342E] flex flex-col font-sans selection:bg-[#CC5500] selection:text-white antialiased">
        {/* Subtle Ambient Radial Glow */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(204,85,0,0.08),rgba(248,244,231,0))] z-0" />
        
        {/* Responsive Global Dark Chocolate Navigation */}
        <Navbar />

        {/* Responsive Content Shell on Warm Cream Canvas */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 z-10 pb-24 md:pb-8 flex flex-col">
          {children}
        </main>

        {/* Desktop / Tablet Anchored Chocolate Brown Footer */}
        <footer className="hidden md:block w-full border-t border-[#CC5500]/25 bg-[#4E342E] text-[#F8F4E7] py-5 mt-auto z-10 shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="bg-[#F8F4E7] px-2 py-0.5 rounded-lg flex items-center shadow-sm">
                <Image
                  src="/pravah-logo.png"
                  alt="PRAVAH"
                  width={82}
                  height={24}
                  className="h-4.5 w-auto object-contain"
                />
              </div>
              <span className="text-[#F8F4E7]/30">|</span>
              <span className="text-[#F8F4E7]/80 font-medium">Kolkata Urban Mobility & Telemetry Network</span>
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
      </body>
    </html>
  );
}
