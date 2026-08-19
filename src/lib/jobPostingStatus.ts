import { SITE_TIMEZONE } from "@/content/timezone";

/**
 * Pure function of "now" (as epoch ms) and a plain expires_at date string —
 * same split lib/calendarAgenda.ts uses for isPastEvent, for the same
 * reason: testable without mocking timers or a database.
 */
export function isExpiredJobPosting(expiresAt: string, nowMs: number): boolean {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIMEZONE }).format(new Date(nowMs));
  return expiresAt < today;
}
