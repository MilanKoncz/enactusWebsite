import { createHash } from "node:crypto";
import { consumeRateLimit } from "./db";

/**
 * Shared across every form route (/api/bewerbung, /api/reminder,
 * /api/kontakt) — a fixed 10-minute window, 5 requests per IP per route.
 * Backed by rate_limit_hits in Postgres rather than an in-memory counter:
 * a Vercel deployment can serve one request from a different serverless
 * instance than the next, so a counter living in process memory would
 * simply not see most of a real flood. The IP itself is never stored, only
 * its SHA-256 hash — see content/retention.ts and the Datenschutzerklärung
 * for how long a bucket lives before pruneRateLimitHits removes it.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

export async function checkRateLimit(route: string, ip: string): Promise<RateLimitResult> {
  const windowStart = new Date(Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS);
  const bucket = `${route}:${hashIp(ip)}`;
  const count = await consumeRateLimit(bucket, windowStart);
  return { allowed: count <= MAX_PER_WINDOW, remaining: Math.max(0, MAX_PER_WINDOW - count) };
}
