// Manually triggers the same daily cleanup Vercel Cron calls at
// /api/cron/cleanup — for a deployment where Cron isn't available, or to
// check the routine on demand. Talks to a real running instance over HTTP
// rather than reimplementing the retention logic here: content/retention.ts
// and lib/retentionCutoff.ts stay the only place that decides when a row is
// expired, whether the trigger is Vercel Cron or this script.
//
// Usage (against a local `npm run build && npm run start`):
//   node --env-file=.env.local scripts/db-cleanup.mjs
// Usage (against production):
//   CLEANUP_URL=https://www.enactus-mannheim.com node --env-file=.env.local scripts/db-cleanup.mjs

const baseUrl = process.env.CLEANUP_URL ?? "http://localhost:3000";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("CRON_SECRET is not set. See .env.example and docs/deployment.md.");
  process.exit(1);
}

const response = await fetch(new URL("/api/cron/cleanup", baseUrl), {
  headers: { Authorization: `Bearer ${secret}` },
});

const body = await response.json().catch(() => null);

if (!response.ok) {
  console.error(`Cleanup request failed: ${response.status} ${response.statusText}`, body);
  process.exit(1);
}

console.log("Cleanup ran:", body);
