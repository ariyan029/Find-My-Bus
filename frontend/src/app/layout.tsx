import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BottomNav from "./components/BottomNav";

export const metadata: Metadata = {
  title: "PRAVAH - Real-Time Kolkata Transit Network",
  description: "Live crowdsourced Kolkata bus tracking, dynamic ETAs, route schedules, and urban stop navigator powered by PRAVAH.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
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
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 z-10 pb-20 md:pb-8 flex flex-col">
          {children}
        </main>

        {/* Mobile Navigation Bar (hidden on tablet/desktop) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
