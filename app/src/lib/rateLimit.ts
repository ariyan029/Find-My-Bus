// Minimal in-memory rate limiter: at most one hit per `windowMs` per key.
// NOTE: per server instance only. Swap for Redis/Upstash when running more than one instance.

const lastHit = new Map<string, number>();
const MAX_KEYS = 10_000;

/** Returns 0 if allowed, otherwise the number of ms the caller must wait. */
export function rateLimit(key: string, windowMs: number): number {
  const now = Date.now();
  const prev = lastHit.get(key);
  if (prev !== undefined && now - prev < windowMs) {
    return windowMs - (now - prev);
  }

  // Keep memory bounded: drop expired keys once the map gets large.
  if (lastHit.size >= MAX_KEYS) {
    for (const [k, t] of lastHit) {
      if (now - t >= windowMs) lastHit.delete(k);
    }
  }

  lastHit.set(key, now);
  return 0;
}
