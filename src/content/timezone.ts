/**
 * The one timezone this site's dates are ever entered and displayed in.
 * Previously named `RECRUITING_TIMEZONE` and defined in content/recruiting.ts
 * — it moved here once a second feature (the event calendar's .ics export,
 * src/lib/ics.ts) needed the same constant and "recruiting" stopped
 * describing what it actually was. content/recruiting.ts re-exports
 * `RECRUITING_TIMEZONE` as this same value, so nothing importing the old
 * name had to change.
 */
export const SITE_TIMEZONE = "Europe/Berlin";
