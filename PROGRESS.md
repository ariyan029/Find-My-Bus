# PRAVAH (Find My Bus — Kolkata) — Progress & Engineering Status

**Last Updated:** 2026-11-24  
**Repository Layout:** Full-stack Next.js app in [`app/`](app/), PostgreSQL + PostGIS Docker setup in [`docker/`](docker/), and ESP32 hardware firmware in [`iot/`](iot/).

---

## 1. Completed Work

### Full-Stack Restructure, Design System & Core Architecture
- Branded as **PRAVAH — Real-Time Kolkata Transit Network** using a Chocolate Brown (`#4E342E`), Cream (`#F8F4E7`), and Burnt Orange (`#CC5500`) glassmorphism design system on Next.js 16, React 19, Tailwind CSS 4, and shadcn/ui.
- Renamed `frontend/` to [`app/`](app/) to reflect that the Next.js workspace houses UI pages, REST API routes, and Prisma ORM (`@prisma/adapter-pg` + PostgreSQL 16 / PostGIS).
- Updated root [`package.json`](package.json), [`app/package.json`](app/package.json), [`README.md`](README.md), and [`app/README.md`](app/README.md).
- Added a shared process-wide live telemetry fallback store ([`app/src/lib/liveStore.ts`](app/src/lib/liveStore.ts)) so live ESP32, Driver, and Rider GPS updates work even when PostgreSQL is offline.

### Live Bus Telemetry: ESP32 IoT + Driver Mobile + Rider Crowdsourcing
- **ESP32 IoT Hardware Ingestion ([`app/src/app/api/iot/telemetry/route.ts`](app/src/app/api/iot/telemetry/route.ts)):**
  - Added `POST /api/iot/telemetry` supporting compact microcontroller keys (`lat`, `lng`, `speed`, `course`, `sats`, `hdop`, `batt`, `rssi`, `bus`, `deviceId`) and optional `IOT_API_KEY` (`x-device-key` header / `apiKey`).
  - Added `GET /api/iot/telemetry` to list registered ESP32 trackers (`online` / `stale` / `offline`) and recent ingestion logs.
- **ESP32 + NEO-6M Arduino Firmware ([`iot/esp32_gps_tracker/esp32_gps_tracker.ino`](iot/esp32_gps_tracker/esp32_gps_tracker.ino)):**
  - Added ready-to-flash firmware using `TinyGPSPlus`, `WiFi`, and `HTTPClient` over UART2 (`GPIO16`/`GPIO17`) plus wiring docs in [`iot/README.md`](iot/README.md).
- **Driver Mobile GPS Broadcast ([`app/src/app/api/driver/broadcast/route.ts`](app/src/app/api/driver/broadcast/route.ts)):**
  - Added `POST /api/driver/broadcast` transmitting high-frequency driver phone GPS alongside live passenger occupancy (`EMPTY`, `SEATS_AVAILABLE`, `STANDING_ONLY`, `FULL`) and trip status (`ON_ROUTE`, `DELAYED`, `CONGESTED`, `IDLE`, `TERMINATED`).
- **Multi-Source Priority ([`app/src/lib/db.ts`](app/src/lib/db.ts)):**
  - `ESP_IOT` and `DRIVER_APP` telemetry takes 45-second authoritative precedence over passive `COMMUTER_CROWD` rider pings while still logging pings and counting contributors.
- **Driver & ESP32 Console UI ([`app/src/app/driver/page.tsx`](app/src/app/driver/page.tsx)):**
  - Added `/driver` route (linked in desktop navbar and mobile bottom nav) with real driver GPS broadcast + Screen Wake Lock, an indoor route simulation mode for testing, live ESP32 fleet status cards, and an interactive API ping tester.

### Database Schema, Dynamic ETAs & Route Search
- **Schema & Seed Upgrades ([`app/prisma/schema.prisma`](app/prisma/schema.prisma), [`docker/init.sql`](docker/init.sql)):**
  - Added `IoTDevice` (`iot_devices` table) and `telemetrySource` / `activeDeviceId` / `satellites` / `occupancyStatus` fields on `Bus` and `TelemetryPing`.
  - Seeded ordered `route_stops`, 21 Kolkata stops, 6 routes, 5 buses, and 3 sample ESP32 devices.
- **Spatial Progress & Journey Planner ([`app/src/lib/transit.ts`](app/src/lib/transit.ts)):**
  - Implemented `haversineKm()` and `computeBusProgress()` to project live bus coordinates onto corridor stop segments and compute `originStop`, `nextStop`, `distanceToNextStopKm`, `etaNextStopMins`, and `progressPct`.
  - Implemented `findJourneys()` for direct and 1-transfer connecting route search with estimated duration, fare, and transfer stop.

### Frontend Polish, Map Fix, Persistence & Offline PWA
- **Map Tile Fix ([`app/src/components/BusMap.tsx`](app/src/components/BusMap.tsx)):**
  - Switched from `tile.openstreetmap.org` (which returned `x-blocked: Access denied`) to **CARTO Voyager** tiles with automatic fallback to **Esri World Street Map** on tile errors, plus enhanced marker tooltips.
- **Home Live Radar ([`app/src/app/page.tsx`](app/src/app/page.tsx)):**
  - Fixed filtered bus selection bug by tracking `selectedBusId` instead of array index.
  - Added `?route=` / `?bus=` deep linking, telemetry source badges, dynamic corridor progress bar, stop bookmarking, and real storage mode indicator.
- **Route Search, Saved Hubs & Profile ([`app/src/app/search/page.tsx`](app/src/app/search/page.tsx), [`app/src/app/saved/page.tsx`](app/src/app/saved/page.tsx), [`app/src/app/profile/page.tsx`](app/src/app/profile/page.tsx)):**
  - Wired From → To search results, **Track Live** CTAs, `localStorage` persistence via [`useSavedTransit.ts`](app/src/lib/useSavedTransit.ts), real contributor ping/km tracking, and live backend probe via `GET /api/health` ([`app/src/app/api/health/route.ts`](app/src/app/api/health/route.ts)).
- **Offline PWA Support ([`app/public/sw.js`](app/public/sw.js), [`app/src/components/ServiceWorkerRegister.tsx`](app/src/components/ServiceWorkerRegister.tsx), [`app/src/lib/api.ts`](app/src/lib/api.ts)):**
  - Added `localStorage` caching for routes/stops and a production service worker.

### Verification Status
- **Unit tests (`npm test`):** `5/5` passing ([`app/tests/transit.test.ts`](app/tests/transit.test.ts)).
- **TypeScript (`tsc --noEmit`) & ESLint (`npm run lint`):** 0 errors.
- **Production build (`next build --webpack`) & smoke test:** Built and verified with HTTP `200` across all pages and API routes (using Node v22.14.0 for build).

---

## 2. What Is Left / Needs Polish / Known Bugs

### Environment, Deployment & Infrastructure
- **Deploy Production Database:** Provision PostgreSQL 16 + PostGIS in cloud/production (currently runs via [`docker-compose.yml`](docker-compose.yml) locally with in-memory fallback when offline).
- **End-to-End Field Testing:** Validate live GPS crowdsourcing, Driver mobile broadcast, and onboard ESP32 hardware telemetry on actual Kolkata bus routes.
- **Node.js Version Requirement:** `prisma@7.10.1` and `@tailwindcss/node@4.3.5` require **Node.js `20.19+`, `22.12+`, or `24+`**. Running `prisma generate` or `next build` on Node `20.18.0` fails with `ERR_REQUIRE_ESM`.
- **PostgreSQL + PostGIS Live Verification:** Database writes/queries in `db.ts` have not yet been tested against a live Docker PostgreSQL container in this environment (Docker socket was inaccessible). Existing Docker volumes initialized before the `route_stops`/`iot_devices` update will need `docker compose down -v && docker compose up -d` (or a Prisma migration) to pick up the new seed rows.
- **Formal Prisma Migrations:** Currently relies on `docker/init.sql` instead of versioned `prisma migrate` migrations and a TypeScript seed script.
- **Multi-Instance Scaling:** `liveStore.ts` and `rateLimit.ts` are process-local in-memory structures; multi-instance or serverless deployments should back rate limiting and ephemeral live state with Redis.

### Bugs & Functional Limitations to Address
- **Bidirectional Route Progress Bug (`computeBusProgress`):** `computeBusProgress()` projects coordinates onto the forward stop sequence (`origin -> destination`). A bus traveling on its **return trip** (`destination -> origin`) will currently still report the forward `nextStop` and increasing/inverted `progressPct` unless trip direction (`forward` vs `return`) is tracked using heading or consecutive GPS fixes.
- **Map Auto-Follow Behavior (`BusMap.tsx`):** `FollowSelected` calls `map.flyTo(...)` whenever the selected bus's coordinates update (every 8s poll), which can snap the viewport back if a user intentionally pans/zooms elsewhere while keeping a bus selected. Add an explicit "Follow / Recenter" toggle.
- **Per-Device IoT Authentication:** `POST /api/iot/telemetry` currently checks a single global `IOT_API_KEY` env var (optional) rather than per-device keys stored in `iot_devices.api_key`, and there is no admin UI to register/revoke ESP32 devices or assign them to buses dynamically.
- **Straight-Line Route Segments:** Corridor progress and ETAs use straight-line Haversine distance between stops rather than road-snapped OSRM/polyline geometry.
- **Polling Instead of Real-Time Push:** Clients poll `/api/buses/live` every 8 seconds; upgrading to Server-Sent Events (SSE) or WebSockets would give smoother real-time motion.

### Polish & Nice-to-Have Roadmap Items
- **SIM800L / 4G Cellular Firmware Variant:** Add a `TinyGSM` sketch alongside the Wi-Fi ESP32 sketch for buses that do not carry a Wi-Fi hotspot.
- **Unused Import Warnings:** Clean up 3 pre-existing unused `lucide-react` imports (`Check`, `ChevronRight`, `Circle`) in [`app/src/components/ui/dropdown-menu.tsx`](app/src/components/ui/dropdown-menu.tsx).
- **Bengali / English UI Toggle:** Stops already carry `bengaliName`, but UI labels and route names are English-only.
- **E2E & CI Pipeline:** Add Playwright browser tests (map rendering, GPS mock, search flows) and a GitHub Actions workflow (`lint`, `tsc`, `test`, `build`).
