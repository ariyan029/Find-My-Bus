import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "./components/BottomNav";

export const metadata: Metadata = {
  title: "Where is my Bus? (Kolkata) - Real-Time Transit Tracking",
  description: "Live crowdsourced Kolkata bus tracking, dynamic ETAs, route schedules, and stop navigator.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-blue-600/30">
        {/* App Frame - Responsive for both Desktop and Mobile */}
        <div className="flex-1 flex justify-center w-full min-h-screen sm:py-4">
          <div className="w-full max-w-lg min-h-screen sm:min-h-[92vh] sm:max-h-[92vh] bg-[#121217] sm:border sm:border-[#272732] sm:rounded-2xl sm:shadow-2xl flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto flex flex-col">
              {children}
            </div>
            <BottomNav />
          </div>
        </div>
      </body>
    </html>
  );
}
