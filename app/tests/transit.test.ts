import test from "node:test";
import assert from "node:assert/strict";
import { KOLKATA_ROUTES, KOLKATA_STOPS } from "../src/lib/data";
import { computeBusProgress, findJourneys, haversineKm } from "../src/lib/transit";
import {
  getMemoryIoTDevices,
  getMemoryLiveBuses,
  ingestMemoryTelemetry,
} from "../src/lib/liveStore";
import { rateLimit } from "../src/lib/rateLimit";

test("haversineKm computes realistic Kolkata distances", () => {
  const howrah = KOLKATA_STOPS.find((s) => s.id === "stop-howrah")!;
  const esplanade = KOLKATA_STOPS.find((s) => s.id === "stop-esplanade")!;
  const dist = haversineKm(howrah.lat, howrah.lng, esplanade.lat, esplanade.lng);
  assert.ok(dist > 1.8 && dist < 3.2, `Expected ~2.4km, got ${dist}`);
});

test("computeBusProgress tracks segment progress and next stop ETA", () => {
  const s12 = KOLKATA_ROUTES.find((r) => r.routeNumber === "S-12")!;
  // Near Ultadanga -> moving toward Karunamoyee
  const progress = computeBusProgress(22.592, 88.405, 30, s12.stopPoints, s12.source, s12.destination);
  assert.equal(progress.originStop, "Howrah Station");
  assert.equal(progress.destination, "New Town Shapoorji");
  assert.equal(progress.nextStop, "Salt Lake Karunamoyee");
  assert.ok(progress.etaNextStopMins >= 1);
  assert.ok(progress.progressPct > 40 && progress.progressPct < 90);
});

test("findJourneys returns direct and 1-transfer Kolkata routes with schedule outcomes", () => {
  const morningPeak = new Date(2026, 10, 25, 9, 15, 0);
  const directRes = findJourneys("Howrah Station", "Salt Lake Sector V", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(directRes.direct.length >= 3);
  const directNums = directRes.direct.map((d) => d.route.routeNumber);
  assert.ok(directNums.includes("S-12"));
  assert.ok(directNums.includes("C-11"));
  assert.ok(directNums.includes("215A"));
  assert.equal(directRes.direct[0].schedule.inServiceNow, true);
  assert.equal(directRes.direct[0].schedule.upcomingDepartures.length, 3);
  assert.equal(directRes.direct[0].schedule.trafficNote, "Peak Hour");

  // Alias matching & new real Kolkata corridors
  const aliasRes = findJourneys("dharmatala", "sector 5", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(aliasRes.direct.some((d) => d.route.routeNumber === "S-12"));

  const behalaRes = findJourneys("Behala", "Howrah", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(behalaRes.direct.some((d) => d.route.routeNumber === "12C"));

  // 1-transfer connection (Bansdroni Metro -> Salt Lake Sector V)
  const transferRes = findJourneys("Bansdroni Metro", "Salt Lake Sector V", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.equal(transferRes.direct.length, 0);
  assert.ok(transferRes.connecting.length >= 1);
  assert.ok(transferRes.connecting[0].transferStop.length > 0);
  assert.ok(transferRes.connecting[0].totalMins > 20);

  // Off-hours fallback still gives morning first bus
  const lateNight = new Date(2026, 10, 25, 2, 0, 0);
  const offHoursRes = findJourneys("Airport", "Gariahat", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: lateNight,
  });
  assert.ok(offHoursRes.direct.some((d) => d.route.routeNumber === "45"));
  assert.equal(offHoursRes.direct[0].schedule.inServiceNow, false);
  assert.equal(offHoursRes.direct[0].schedule.trafficNote, "Next Morning Service");

  // Barasat-origin routes & granular stops
  const barasatHowrah = findJourneys("Champadali", "Howrah", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(barasatHowrah.direct.some((d) => d.route.routeNumber === "L238"));
  assert.ok(barasatHowrah.direct.some((d) => d.route.routeNumber === "AC-2"));

  const granularL238 = findJourneys("Sethpukur", "Kestopur", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(granularL238.direct.some((d) => d.route.routeNumber === "L238"));

  const barasatDks = findJourneys("Barasat", "Dakshineswar", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(barasatDks.direct.some((d) => d.route.routeNumber === "DN-2"));
  assert.ok(barasatDks.direct.some((d) => d.route.routeNumber === "DN-43"));

  const barasatGaria = findJourneys("Barasat", "Garia", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(barasatGaria.direct.some((d) => d.route.routeNumber === "S-37"));
  assert.ok(barasatGaria.direct.some((d) => d.route.routeNumber === "AC-37"));

  // Esplanade, Sealdah & Howrah across Kolkata
  const espGaria = findJourneys("Esplanade", "Garia", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(espGaria.direct.some((d) => d.route.routeNumber === "80A"));
  assert.ok(espGaria.direct.some((d) => d.route.routeNumber === "S-5"));
  assert.ok(espGaria.direct.some((d) => d.route.routeNumber === "AC-5"));

  const sdahGolfGreen = findJourneys("Sealdah", "Golf Green", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(sdahGolfGreen.direct.some((d) => d.route.routeNumber === "223"));
  assert.ok(sdahGolfGreen.direct.some((d) => d.route.routeNumber === "240"));

  const hwhBelur = findJourneys("Howrah", "Belur Math", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(hwhBelur.direct.some((d) => d.route.routeNumber === "54"));
  assert.ok(hwhBelur.direct.some((d) => d.route.routeNumber === "56"));

  const hwhSectorV = findJourneys("Howrah", "Sector V", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(hwhSectorV.direct.some((d) => d.route.routeNumber === "71"));
  assert.ok(hwhSectorV.direct.some((d) => d.route.routeNumber === "44A"));

  // Intermediate / landmark corridor matching (middle stops between source & destination)
  const barasatAdamas = findJourneys("Barasat", "Adamas University", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(barasatAdamas.direct.some((d) => d.route.routeNumber === "81"));

  const barasatCc1 = findJourneys("Barasat", "City Centre 1", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(barasatCc1.direct.some((d) => d.route.routeNumber === "DN-8"));
  assert.ok(barasatCc1.direct.some((d) => d.corridorMatchNote));

  const howrahSouthCity = findJourneys("Howrah", "South City Mall", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
  });
  assert.ok(howrahSouthCity.direct.some((d) => d.route.routeNumber === "AC-1"));

  // Arbitrary map coordinate between Barasat Colony More and Nilganj More resolves Route 81
  const customMapPoint = findJourneys("Barasat", "Jagannathpur Campus", KOLKATA_ROUTES, KOLKATA_STOPS, {
    departureTime: morningPeak,
    toCoord: { lat: 22.7375, lng: 88.4380, label: "Jagannathpur Campus", source: "nominatim" },
  });
  assert.ok(customMapPoint.direct.some((d) => d.route.routeNumber === "81"));
  assert.ok(customMapPoint.direct[0].corridorMatchNote);
});

test("ingestMemoryTelemetry enforces ESP32/Driver priority over passive crowd pings", () => {
  const espResult = ingestMemoryTelemetry({
    deviceId: "esp32-test-901",
    busId: "bus-wb01-101",
    busNumber: "S-12",
    source: "ESP_IOT",
    latitude: 22.5855,
    longitude: 88.4208,
    accuracyMeters: 8,
    speedKmh: 40,
    heading: 90,
    satellites: 10,
    batteryPct: 95,
    signalRssi: -60,
  });
  assert.equal(espResult.updatedPosition, true);
  assert.equal(espResult.source, "ESP_IOT");

  const devices = getMemoryIoTDevices();
  const dev = devices.find((d) => d.id === "esp32-test-901");
  assert.ok(dev);
  assert.equal(dev.connectionState, "online");
  assert.equal(dev.satellites, 10);

  // Crowd ping within 45s should NOT override authoritative ESP32 coordinates
  const crowdResult = ingestMemoryTelemetry({
    busId: "bus-wb01-101",
    busNumber: "S-12",
    contributorId: "rider-device-1234",
    source: "COMMUTER_CROWD",
    latitude: 22.5001,
    longitude: 88.3001,
    accuracyMeters: 15,
  });
  assert.equal(crowdResult.updatedPosition, false);

  const bus = getMemoryLiveBuses("S-12").find((b) => b.id === "bus-wb01-101")!;
  assert.equal(bus.currentLat, 22.5855);
  assert.equal(bus.telemetrySource, "ESP_IOT");

  // Driver update overrides with DRIVER_APP + occupancy
  const driverResult = ingestMemoryTelemetry({
    busId: "bus-wb01-101",
    busNumber: "S-12",
    driverName: "Driver Test",
    source: "DRIVER_APP",
    latitude: 22.5735,
    longitude: 88.4339,
    accuracyMeters: 10,
    occupancyStatus: "FULL",
    status: "CONGESTED",
  });
  assert.equal(driverResult.updatedPosition, true);
  const updatedBus = getMemoryLiveBuses("S-12").find((b) => b.id === "bus-wb01-101")!;
  assert.equal(updatedBus.occupancy, "FULL");
  assert.equal(updatedBus.status, "CONGESTED");
  assert.equal(updatedBus.telemetrySource, "DRIVER_APP");
});

test("rateLimit blocks bursts within windowMs", () => {
  const key = `test-key-${Date.now()}`;
  assert.equal(rateLimit(key, 5000), 0);
  const wait = rateLimit(key, 5000);
  assert.ok(wait > 0 && wait <= 5000);
});
