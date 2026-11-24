# 🚌 Find My Bus — Kolkata

**Live, crowdsourced bus tracking for Kolkata.** See where your bus is right now, how crowded it is, and when it'll reach your stop. Riders on board share their phone's GPS so everyone else can see the bus move.

> Think *"Where is my Train"*, but for WBTC, CSTC and private buses in Kolkata.

**Status:** early MVP. The app works end to end with sample data. Real ETAs and stop-to-stop search are next (see [Roadmap](#-roadmap)).

---

## ✨ Features

| | |
|---|---|
| 🗺️ **Live map** | Buses and stops on an OpenStreetMap map. Markers are coloured by status and point the way the bus is heading. Tap a bus to follow it. |
| 📡 **Crowdsourced GPS** | Tap **Share Location** while on board and your phone sends its position every 10s. The screen stays awake while sharing, and sharing stops by itself after 2 hours. |
| 🔄 **Auto-refresh** | The bus list refreshes every 15 seconds. |
| 🔍 **Route search** | Filter routes by number, name or endpoint, and by type (AC Express, Ordinary, Minibus). |
| 👥 **Crowd levels** | See whether a bus has seats free, standing room only, or is full. |
| 🇮🇳 **Bengali names** | Stops show their Bengali names (e.g. হাওড়া স্টেশন). |
| 🛟 **Works without a DB** | If Postgres isn't running, the API serves built-in sample Kolkata data, so the UI always works. |
| 📱 **Mobile-first** | Designed as a phone-sized app with an installable PWA manifest. |

## 🧱 Tech stack

- **Frontend:** [Next.js 16](https://nextjs.org) (App Router), React 19, Tailwind CSS 4, shadcn/ui, Radix, lucide icons
- **Map:** [Leaflet](https://leafletjs.com) + [react-leaflet](https://react-leaflet.js.org) with OpenStreetMap tiles
- **Backend:** Next.js route handlers, [zod](https://zod.dev) validation
- **Database:** PostgreSQL 16 + PostGIS (Docker), [Prisma 7](https://www.prisma.io) with the `pg` adapter

## 🚀 Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 20 or newer
- [pnpm](https://pnpm.io) (`npm i -g pnpm`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), optional. Without it the app uses sample data.

### 1. Clone and install

```bash
git clone https://github.com/ariyan029/Find-My-Bus.git
cd Find-My-Bus/app
pnpm install
pnpm exec prisma generate
```

### 2. Set up environment variables

Docker Compose reads `.env` from the repo root, and Next.js reads it from `app/`, so copy the example to both places:

```bash
cp .env.example .env && cp .env.example app/.env
```

(Run that from the repo root.) The defaults work for local development. Never commit `.env`; it's in `.gitignore`.

### 3. Start the database (optional)

From the repo root:

```bash
docker compose up -d
```

This starts PostgreSQL with PostGIS on port `5432`. On first start it creates the tables and seeds Kolkata stops, routes and sample buses from [`docker/init.sql`](docker/init.sql).

### 4. Run the app

```bash
cd app
pnpm dev
```

Open **http://localhost:3000**.

> 📍 **Testing GPS sharing:** browsers only allow location access on `https://` or `localhost`. To try it on your phone, use a tunnel (e.g. `ngrok http 3000`) or deploy it.

## 📁 Project structure

```
Find-My-Bus/
├── docker-compose.yml          # PostgreSQL + PostGIS
├── docker/init.sql             # Schema + Kolkata seed data
├── .env.example                # Environment variable template
├── iot/                        # ESP32 + NEO-6M Arduino firmware
└── app/                        # Full-stack Next.js app (UI + API + Prisma)
    ├── prisma/schema.prisma    # Prisma models (mirror init.sql)
    └── src/
        ├── app/
        │   ├── page.tsx        # Home: live map, tracked bus, share location
        │   ├── search/         # Route navigator
        │   ├── saved/          # Saved routes & stops
        │   ├── profile/        # Commuter profile
        │   └── api/            # REST endpoints (see below)
        ├── components/
        │   ├── BusMap.tsx      # Leaflet map
        │   └── ui/             # shadcn/ui components
        └── lib/
            ├── db.ts               # Prisma client + DB-or-fallback queries
            ├── data.ts             # Types + sample Kolkata data
            ├── enums.ts            # Bus status / occupancy values & labels
            ├── api.ts              # Client hooks: useLiveBuses, useRoutes, useStops
            ├── useLocationSharing.ts  # GPS sharing hook
            └── rateLimit.ts        # In-memory rate limiter
```

## 🔌 API

All endpoints return JSON.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/buses/live?route=S-12` | Live buses with computed `nextStop`, `etaNextStopMins`, and `progressPct` |
| `GET` | `/api/routes?q=howrah` | Routes with ordered `stopPoints` from `route_stops` |
| `GET` | `/api/stops` | Bus stops with connecting routes |
| `POST` | `/api/iot/telemetry` | Receive GPS telemetry from an onboard ESP32 + NEO-6M IoT tracker |
| `GET` | `/api/iot/telemetry` | List registered ESP32 devices & recent telemetry stream |
| `POST` | `/api/driver/broadcast` | Receive live GPS + occupancy/status from a driver's mobile device |
| `POST` | `/api/crowdsource/ping` | Send a rider's GPS position for a bus |
| `GET` | `/api/health` | Check PostgreSQL connectivity, storage mode, and active device counts |

<details>
<summary><b>POST /api/crowdsource/ping</b>: request and responses</summary>

```json
{
  "busNumber": "S-12",
  "busId": "bus-wb01-101",
  "contributorId": "anonymous-device-uuid",
  "latitude": 22.5802,
  "longitude": 88.4110,
  "accuracyMeters": 12,
  "speedKmh": 36,
  "heading": 85
}
```

Only `busNumber`, `latitude` and `longitude` are required.

| Status | Meaning |
|---|---|
| `200` | Saved. The bus's position is updated if the GPS fix is accurate to 100 m or better. |
| `400` | Invalid input. `issues` lists the problem fields. |
| `429` | Too fast. Max one ping every 5 seconds per device. |
| `503` | Database unavailable. Nothing was saved. |

</details>

## 🛠️ Scripts

Run these inside `app/`:

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | Lint with ESLint |
| `pnpm exec tsc --noEmit` | Type-check |

## 🗺️ Roadmap

- [x] Live map with buses and stops
- [x] Real GPS sharing from riders & Driver Mobile Broadcast console (`/driver`)
- [x] ESP32 + NEO-6M IoT hardware ingestion endpoint (`/api/iot/telemetry`) & Arduino sketch (`iot/`)
- [x] Pages powered by the API with live in-memory + DB fallback
- [x] Seed `route_stops` and calculate the next stop, progress, and ETA from bus positions
- [x] Direct & 1-transfer From → To search across stops
- [x] Real saved routes, stops, and recent searches (stored on the device)
- [x] Offline support (service worker + localStorage route/stop cache)
- [x] Automated unit tests (`pnpm test`)
- [ ] Bengali / English UI language toggle
- [ ] Prisma migrations (replacing `init.sql`)

More detail is in [`implementation_plan.md`](implementation_plan.md), [`system_architecture.md`](system_architecture.md) (long-term vision) and [`progress_saving.md`](progress_saving.md).

## 🔒 Privacy

Location is shared **only** while you've tapped *Share Location*. You can stop at any time, and it stops by itself after 2 hours or when you leave the page. Each device is identified by a random ID saved in the browser, with no account, name or phone number attached.

## 🤝 Contributing

Issues and pull requests are welcome, especially corrections to Kolkata route and stop data. Before opening a PR, run `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm build`.

## 🙏 Acknowledgements

- Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Route and stop names are based on WBTC and CSTC services. The sample data is approximate and not official.
