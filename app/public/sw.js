const CACHE_NAME = "pravah-offline-v1";
const STATIC_ASSETS = [
  "/",
  "/search",
  "/saved",
  "/driver",
  "/profile",
  "/manifest.json",
  "/pravah-logo.png",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache live telemetry or health endpoints.
  if (
    url.pathname.startsWith("/api/buses/live") ||
    url.pathname.startsWith("/api/iot/") ||
    url.pathname.startsWith("/api/health")
  ) {
    return;
  }

  // Network-first with cache fallback for routes, stops, and pages.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
