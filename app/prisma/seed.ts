import dns from "node:dns";
import net from "node:net";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  ACTIVE_LIVE_BUSES,
  KOLKATA_ROUTES,
  KOLKATA_STOPS,
  SEED_IOT_DEVICES,
} from "../src/lib/data";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  dns.setDefaultResultOrder("ipv4first");
  net.setDefaultAutoSelectFamilyAttemptTimeout?.(3000);
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 15000 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log(`Seeding ${KOLKATA_STOPS.length} stops...`);
    await prisma.stop.createMany({
      data: KOLKATA_STOPS.map((s) => ({
        id: s.id,
        name: s.name,
        bengaliName: s.bengaliName,
        code: s.code,
        latitude: s.lat,
        longitude: s.lng,
        landmark: s.landmark,
        zone: s.zone,
      })),
      skipDuplicates: true,
    });

    console.log(`Seeding ${KOLKATA_ROUTES.length} routes...`);
    await prisma.route.createMany({
      data: KOLKATA_ROUTES.map((r) => ({
        id: r.id,
        routeNumber: r.routeNumber,
        name: r.name,
        source: r.source,
        destination: r.destination,
        distanceKm: r.distanceKm,
        totalStops: r.totalStops,
        busType: r.busType,
        operator: r.operator,
        averageTripTimeMins: r.avgTripMins,
        fareMin: r.fareMin,
        fareMax: r.fareMax,
        isActive: true,
      })),
      skipDuplicates: true,
    });

    const routeStopsData = KOLKATA_ROUTES.flatMap((r) =>
      (r.stopPoints ?? []).map((sp) => ({
        id: `rs-${r.id}-${sp.sequence}`,
        routeId: r.id,
        stopId: sp.stopId,
        stopSequence: sp.sequence,
        typicalTimeMins: sp.typicalTimeMins,
        fareFromStart: sp.fareFromStart,
      }))
    );

    console.log(`Seeding ${routeStopsData.length} route_stops...`);
    await prisma.routeStop.createMany({
      data: routeStopsData,
      skipDuplicates: true,
    });

    console.log(`Seeding ${ACTIVE_LIVE_BUSES.length} buses...`);
    await prisma.bus.createMany({
      data: ACTIVE_LIVE_BUSES.map((b) => ({
        id: b.id,
        busNumber: b.busNumber,
        routeId: b.routeId,
        regNumber: b.regNumber,
        driverName: b.driverName ?? null,
        currentLat: b.currentLat,
        currentLng: b.currentLng,
        heading: b.heading,
        speedKmh: b.speedKmh,
        status: b.status,
        occupancyStatus: b.occupancy,
        telemetrySource: b.telemetrySource,
        activeDeviceId: b.activeDeviceId ?? null,
      })),
      skipDuplicates: true,
    });

    console.log(`Seeding ${SEED_IOT_DEVICES.length} IoT devices...`);
    await prisma.ioTDevice.createMany({
      data: SEED_IOT_DEVICES.map((d) => ({
        id: d.id,
        busId: d.busId,
        busNumber: d.busNumber,
        hardwareType: d.hardwareType,
        firmwareVersion: d.firmwareVersion,
        batteryPct: d.batteryPct,
        satellites: d.satellites,
        signalRssi: d.signalRssi,
        lastLat: d.lastLat,
        lastLng: d.lastLng,
        lastSeen: d.lastSeenIso ? new Date(d.lastSeenIso) : new Date(),
        isActive: d.isActive,
      })),
      skipDuplicates: true,
    });

    console.log("Neon PostgreSQL seed complete.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
