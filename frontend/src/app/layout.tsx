import type { Metadata, Viewport } from "next";
import "./globals.css";
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
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F4E7] text-[#4E342E] flex flex-col font-sans selection:bg-[#CC5500]/25 selection:text-[#4E342E]">
        {/* Ambient Warm Gradient Backdrop */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(204,85,0,0.06),rgba(248,244,231,0))] z-0" />
        
        {/* Main App Frame - Responsive for Mobile, Tablet, and Desktop */}
        <div className="flex-1 flex justify-center w-full min-h-screen sm:py-6 z-10">
          <div className="w-full max-w-lg min-h-screen sm:min-h-[92vh] sm:max-h-[92vh] bg-[#F8F4E7]/95 sm:border sm:border-[#4E342E]/14 sm:rounded-3xl sm:shadow-[0_24px_70px_-15px_rgba(78,52,46,0.16)] flex flex-col overflow-hidden relative backdrop-blur-md">
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
