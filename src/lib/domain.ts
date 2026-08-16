/**
 * The bare domain to show on a LinkCard (ui/LinkCard.tsx) — "smilegreen.de",
 * not the full URL with its scheme and path. Falls back to the raw string
 * for a value that isn't a well-formed absolute URL, rather than throwing:
 * this only ever feeds a visible label, never a navigation target.
 */
export function formatDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
