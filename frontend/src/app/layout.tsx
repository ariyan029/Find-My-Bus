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
  themeColor: "#F8F4E7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F4E7] text-[#4E342E] flex flex-col font-sans selection:bg-[#CC5500]/25 selection:text-[#4E342E] antialiased">
        {/* Ambient Warm Gradient Backdrop */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(204,85,0,0.06),rgba(248,244,231,0))] z-0" />
        
        {/* Responsive Global Navigation */}
        <Navbar />

        {/* Responsive Content Shell */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 z-10 pb-20 md:pb-6 flex flex-col">
          {children}
        </main>

        {/* Desktop / Tablet Minimal Footer */}
        <footer className="hidden md:block w-full border-t border-[#4E342E]/10 bg-[#F8F4E7]/80 backdrop-blur-md py-4 mt-auto z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-[#7E655D]">
            <div className="flex items-center gap-3">
              <Image
                src="/pravah-logo.png"
                alt="PRAVAH"
                width={86}
                height={26}
                className="h-5 w-auto object-contain opacity-85"
              />
              <span className="text-[#4E342E]/20">|</span>
              <span>Real-Time Kolkata Transit Network</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-medium">
              <span>GPS Telemetry v1.0</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-emerald-800 font-semibold">All Systems Operational</span>
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
