/**
 * Shared between ApplicationForm.tsx (which starts the clock and skips its
 * own "submitted" state before this much time has passed) and
 * /api/bewerbung's route handler (which re-checks the same threshold
 * server-side, since a client-only check is trivial to skip by calling the
 * API directly). One constant, so the two checks can't quietly drift apart.
 */
export const MIN_FILL_MS = 3000;
