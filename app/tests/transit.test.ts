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

test("findJourneys returns direct and 1-transfer Kolkata routes", () => {
  const directRes = findJourneys("Howrah Station", "Salt Lake Sector V", KOLKATA_ROUTES, KOLKATA_STOPS);
  assert.ok(directRes.direct.length >= 2);
  const directNums = directRes.direct.map((d) => d.route.routeNumber);
  assert.ok(directNums.includes("S-12"));
  assert.ok(directNums.includes("C-11"));

  const transferRes = findJourneys("Howrah Station", "Gariahat Junction", KOLKATA_ROUTES, KOLKATA_STOPS);
  assert.equal(transferRes.direct.length, 0);
  assert.ok(transferRes.connecting.length >= 1);
  assert.equal(transferRes.connecting[0].transferStop, "Salt Lake Karunamoyee");
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
