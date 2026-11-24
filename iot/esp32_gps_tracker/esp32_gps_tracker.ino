/*
 * PRAVAH (Find My Bus - Kolkata)
 * ESP32 + NEO-6M GPS Hardware Tracker Firmware
 *
 * Hardware:
 *   - ESP32 DevKit v1
 *   - u-blox NEO-6M / NEO-M8N GPS Module (UART2: RX=GPIO16, TX=GPIO17)
 *
 * Required Arduino Libraries:
 *   - TinyGPSPlus (by Mikal Hart)
 *   - Built-in ESP32 WiFi & HTTPClient
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <TinyGPSPlus.h>

// ─── Configuration ─────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "BUS_HOTSPOT_SSID";      // Or onboard 4G router SSID
const char* WIFI_PASS     = "BUS_HOTSPOT_PASSWORD";
const char* SERVER_URL    = "https://your-pravah-domain.com/api/iot/telemetry";
const char* DEVICE_ID     = "esp32-wb01-101";
const char* BUS_NUMBER    = "S-12";
const char* REG_NUMBER    = "WB-01-A-4482";
const char* IOT_API_KEY   = "";                      // Optional: match IOT_API_KEY env var

const unsigned long SEND_INTERVAL_MS = 5000;
const int GPS_RX_PIN = 16; // Connect to NEO-6M TX
const int GPS_TX_PIN = 17; // Connect to NEO-6M RX

TinyGPSPlus gps;
HardwareSerial gpsSerial(2);
unsigned long lastSendMs = 0;

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("[WiFi] Connecting");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? " connected!" : " timeout.");
}

void sendTelemetry() {
  if (!gps.location.isValid()) {
    Serial.println("[GPS] Waiting for valid satellite fix...");
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) return;
  }

  double lat = gps.location.lat();
  double lng = gps.location.lng();
  double speedKmh = gps.speed.isValid() ? gps.speed.kmph() : 0.0;
  double course = gps.course.isValid() ? gps.course.deg() : 0.0;
  int sats = gps.satellites.isValid() ? (int)gps.satellites.value() : 0;
  double hdop = gps.hdop.isValid() ? gps.hdop.hdop() : 2.0;
  int rssi = WiFi.RSSI();

  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"busNumber\":\"" + String(BUS_NUMBER) + "\",";
  payload += "\"regNumber\":\"" + String(REG_NUMBER) + "\",";
  payload += "\"lat\":" + String(lat, 6) + ",";
  payload += "\"lng\":" + String(lng, 6) + ",";
  payload += "\"speed\":" + String(speedKmh, 1) + ",";
  payload += "\"course\":" + String(course, 1) + ",";
  payload += "\"sats\":" + String(sats) + ",";
  payload += "\"hdop\":" + String(hdop, 1) + ",";
  payload += "\"rssi\":" + String(rssi) + ",";
  payload += "\"hardwareType\":\"ESP32_NEO6M\",";
  payload += "\"firmwareVersion\":\"1.2.0\"";
  payload += "}";

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  if (strlen(IOT_API_KEY) > 0) {
    http.addHeader("x-device-key", IOT_API_KEY);
  }

  int code = http.POST(payload);
  Serial.printf("[HTTP] POST %d -> %s\n", code, http.getString().c_str());
  http.end();
}

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  connectWiFi();
  Serial.println("[PRAVAH] ESP32 Bus Tracker initialized.");
}

void loop() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  if (millis() - lastSendMs >= SEND_INTERVAL_MS) {
    lastSendMs = millis();
    sendTelemetry();
  }
}
