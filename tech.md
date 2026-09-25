# Where is my Bus (Kolkata) - Tech Stack Analysis

## 1. Frontend (Web Application / PWA)
**Recommendation**: Next.js (React) + Tailwind CSS + Vanilla CSS for animations
**Why**: Next.js is fantastic for building fast, SEO-friendly, and responsive web applications. Making it a Progressive Web App (PWA) means users can still "install" it on their home screens like a regular app. Tailwind ensures rapid styling, while Vanilla CSS will be used for high-end micro-animations to give it a premium feel.

## 2. Backend (Server & API)
**Recommendation**: Node.js with Express / Next.js API Routes
**Why**: Node.js is lightweight, asynchronous, and handles concurrent connections well. Since we are using Next.js, we can also leverage its built-in API routes for a unified full-stack experience.

## 3. Database
- **Static Data (Routes, Stops, Fares)**: PostgreSQL (via Prisma ORM) or MongoDB
  **Why**: Good for structured data and complex queries like finding direct or connecting buses between two stops.
- **Real-time Data (Live Tracking)**: Firebase Realtime Database, Supabase, or Redis
  **Why**: Extremely fast read/write for live location updates. For a website MVP, Firebase or Supabase handles real-time syncing easily via WebSockets.

## 4. Maps and Location Services
**Recommendation**: Google Maps Platform (Maps JavaScript API) or Mapbox GL JS
**Why**: Industry standard, highly accurate mapping, crucial for plotting routes and showing live bus movement on the web interface.

## 5. Crowdsourced Tracking Mechanism (Web Considerations)
**Idea**: When a user boards a bus, they can tap "Start Tracking Journey" on the website. Their browser's Geolocation API will send updates to the backend.
**Limitation**: Mobile browsers restrict background location tracking to save battery. Users might need to keep the screen active while sharing their location. This is a tradeoff for a web MVP, which we will solve completely when building the native app later.
