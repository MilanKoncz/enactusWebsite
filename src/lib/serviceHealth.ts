import { mailHealthSnapshot } from "./db";

/**
 * Reachability/health checks for /admin/system. Neither throws: a health
 * panel that crashes because a dependency is down is the opposite of
 * useful.
 *
 * Database health isn't here: countRowsPerTable() already proves Neon is
 * answering, so a separate ping would be a second round trip to learn
 * something the page has just been told.
 */
export type ServiceHealthLevel = "ok" | "warning" | "error";

// `reason` names which sentence explains the level; the page (via
// messages/*.json) owns the actual copy, this only says which template
// applies and what data it needs — keeps a diagnostic sentence shown to the
// board out of lib code, per the "user-facing strings live in messages/"
// rule.
export type ServiceStatus = {
  level: ServiceHealthLevel;
  reason: "missingKey" | "invalidKey" | "noAttempts" | "lastFailed" | "lastSucceeded";
  lastAttemptAt: Date | null;
  failedLast30Days: number;
};

/**
 * Resend's API has no endpoint a send-only-scoped key can call to prove
 * itself — GET /domains 401s for such a key even though POST /emails (the
 * real send path, lib/mail.ts) works fine, which used to make an expired
 * key and a merely-restricted one look identical here. Instead of a second,
 * more-privileged key just for this page, this reads what actually
 * happened: the most recent real send attempt, from mail_status across the
 * three mail-tracking tables (lib/db.ts's mailHealthSnapshot).
 *
 * Green requires both a plausible key AND that the most recent attempt
 * succeeded — older failures that have since been resolved don't hold the
 * status red forever, but the 30-day failure count still rides along in
 * the detail so a recovered outage isn't invisible either.
 */
export async function checkResend(): Promise<ServiceStatus> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { level: "error", reason: "missingKey", lastAttemptAt: null, failedLast30Days: 0 };
  }
  if (!apiKey.startsWith("re_")) {
    return { level: "error", reason: "invalidKey", lastAttemptAt: null, failedLast30Days: 0 };
  }

  const snapshot = await mailHealthSnapshot();

  if (!snapshot.lastAttempt) {
    return { level: "warning", reason: "noAttempts", lastAttemptAt: null, failedLast30Days: snapshot.failedLast30Days };
  }

  const failed = snapshot.lastAttempt.status === "failed";
  return {
    level: failed ? "error" : "ok",
    reason: failed ? "lastFailed" : "lastSucceeded",
    lastAttemptAt: snapshot.lastAttempt.at,
    failedLast30Days: snapshot.failedLast30Days,
  };
}
