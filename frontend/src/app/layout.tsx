import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import BottomNav from "./components/BottomNav";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Where is my Bus?",
  description: "Live track your local Kolkata buses with real-time ETA.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0f0f14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} antialiased`}>
      <body className="h-[100dvh] flex flex-col font-sans overflow-hidden bg-[var(--background)] text-[var(--foreground)] selection:bg-brand-500/20">
        
        {/* Main Application Shell */}
        <main className="flex-1 flex flex-col w-full max-w-[430px] mx-auto relative h-full overflow-hidden bg-[var(--color-surface)] shadow-[0_0_80px_rgba(99,102,241,0.06)] ring-1 ring-white/[0.04]">
          
          <div className="flex-1 relative z-10 w-full h-full overflow-hidden flex flex-col">
            {children}
          </div>
          
          <BottomNav />
        </main>
        
      </body>
    </html>
  );
}
