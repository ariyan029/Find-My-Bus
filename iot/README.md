# PRAVAH ESP32 IoT Hardware Bus Tracker

This directory contains the Arduino/ESP32 firmware for fitting a hardware GPS unit onto a bus so its live location streams directly to the PRAVAH web/mobile platform.

## Wiring (ESP32 + NEO-6M GPS)

| NEO-6M Pin | ESP32 Pin |
|---|---|
| `VCC` | `3.3V` (or `5V` depending on breakout regulator) |
| `GND` | `GND` |
| `TX` | `GPIO 16` (`RX2`) |
| `RX` | `GPIO 17` (`TX2`) |

> For buses without a Wi-Fi / 4G hotspot on board, swap `WiFi` + `HTTPClient` with `TinyGSM` + a SIM800L / A7670C LTE modem using the exact same JSON payload and `POST /api/iot/telemetry` endpoint.

## Payload Format

```http
POST /api/iot/telemetry
Content-Type: application/json
x-device-key: <optional IOT_API_KEY>
```

```json
{
  "deviceId": "esp32-wb01-101",
  "busNumber": "S-12",
  "regNumber": "WB-01-A-4482",
  "lat": 22.5802,
  "lng": 88.4110,
  "speed": 38.5,
  "course": 85.0,
  "sats": 9,
  "hdop": 1.2,
  "rssi": -64
}
```
