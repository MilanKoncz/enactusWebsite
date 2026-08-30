import { sendInsertFailureAlert } from "./mail";
import { checkRateLimit } from "./rateLimit";

/**
 * The board's own safety net for the failure mode that broke Ideathon
 * signups from 2026-08-26 to 2026-08-30: a form's database write fails, the
 * visitor sees the (correct) error message, and nobody who could fix it
 * ever finds out — the console.error next to every catch this calls from
 * lands in Vercel's runtime logs, which this project keeps for about a day
 * (docs/deployment.md).
 *
 * Deliberately not a new table or a queue: this reuses the existing
 * rate-limit bucket mechanism (lib/rateLimit.ts) purely as a once-per-window
 * de-duplicator, keyed by route rather than by IP, so a sustained outage
 * sends one alert per window instead of one per failed request. Never
 * throws past the caller — an alert that can't be sent must not turn an
 * already-handled failure into an unhandled one.
 */
export async function alertOnInsertFailure(route: string, error: unknown): Promise<void> {
  try {
    const rateLimit = await checkRateLimit(`insert-failure-alert:${route}`, "board");
    if (!rateLimit.allowed) return;
    const message = error instanceof Error ? error.message : String(error);
    await sendInsertFailureAlert(route, message);
  } catch (alertError) {
    console.error(`Failed to send the insert-failure alert for ${route}`, alertError);
  }
}
