import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { germanTeamCities } from "@/content/network";

// Germany's real Admin-0 country boundary (Natural Earth v4.1.0, 1:10m,
// public domain), simplified to ~20 vertices and projected with an
// equal-area conic centered on Germany — not a hand-drawn approximation.
// Source, license, exact simplification steps, and how to regenerate this
// path all live in docs/content-guide.md ("Update the Germany map on
// /events") rather than here, so they survive independently of this one
// component. No third-party map data loaded at runtime either way — this
// is a static path, no map tile provider, no request.
const OUTLINE_PATH =
  "M370.3,450.9L337.0,543.0L169.0,542.0L74.8,536.0L107.2,439.4L22.5,400.2L14.9,352.3L12,307.1L73.7,132.4L150.8,88.4L139.0,17.0L170.8,23.7L225.0,78.5L318.4,48.6L373.1,98.8L408,299.7L305.9,337.6Z";

const VIEWBOX_WIDTH = 420;
const VIEWBOX_HEIGHT = 560;

// Mannheim's real center coordinates, run through the exact same
// geoConicEqualArea projection as OUTLINE_PATH above (not eyeballed) — see
// docs/content-guide.md for the projection parameters and how to add a
// point that stays consistent with the outline. Presentation detail (pixel
// coordinates, not the underlying lon/lat fact), so it lives here rather
// than in content/network.ts.
const MANNHEIM_POINT = { x: 120.7, y: 402 };
const MANNHEIM_DOT_RADIUS = 9;

// Every other German team city's pixel position — projected with the exact
// same geoConicEqualArea setup as MANNHEIM_POINT above (48.66°N/53.66°N
// parallels, centered 10.45°E), not eyeballed. Since that setup's
// fitExtent scale/translate aren't reproduced here, the fit was instead
// solved via least squares against MANNHEIM_POINT and five originally-
// confirmed teams' known pixel positions (muenchen/muenster/hamburg/koeln/
// karlsruhe) — recovers the same scale and translate fitExtent would have
// chosen, confirmed by re-projecting those six and checking the result
// lands within a few hundredths of a pixel of their known values. See
// content/network.ts's germanTeamCities for each city's source lat/lon and
// how the roster itself (names and URLs both) was retrieved.
const CITY_POINTS: Record<string, { x: number; y: number }> = {
  aachen: { x: 16.1, y: 305.6 },
  augsburg: { x: 233.6, y: 482.7 },
  bayreuth: { x: 263.7, y: 370.2 },
  berlin: { x: 340.3, y: 184.5 },
  bochum: { x: 69.2, y: 258.0 },
  bonn: { x: 61.5, y: 310.7 },
  braunschweig: { x: 215.7, y: 205.0 },
  duesseldorf: { x: 48.7, y: 275.1 },
  frankfurt: { x: 131.7, y: 357.8 },
  goettingen: { x: 188.7, y: 256.8 },
  hamburg: { x: 193.1, y: 113.6 },
  hannover: { x: 181.2, y: 197.2 },
  ingolstadt: { x: 258.2, y: 454.3 },
  karlsruhe: { x: 116.8, y: 436.1 },
  kiel: { x: 198.8, y: 58.7 },
  koeln: { x: 56, y: 296.2 },
  lueneburg: { x: 210.7, y: 136.0 },
  magdeburg: { x: 263.8, y: 215.2 },
  mainz: { x: 111.6, y: 365.7 },
  muenchen: { x: 266.2, y: 499.1 },
  muenster: { x: 88.6, y: 224.6 },
  straubing: { x: 311.8, y: 445.0 },
  stuttgart: { x: 152.9, y: 453.4 },
};
const CITY_DOT_RADIUS = 5.5;

// The city dots are real, keyboard-reachable links, laid out as siblings of
// the decorative SVG rather than inside it: an element with role="img"
// flattens its descendants into one accessible name, which would make
// interactive content inside it unreachable for a screen-reader or
// keyboard user. So the SVG (silhouette + every dot, all aria-hidden) is
// purely a picture with one describing label, and every linked dot is a
// plain <a> positioned on top of it at the same coordinates. Mannheim has
// no link (it's this site, not a sibling team) and stays inside the
// picture as a permanently-labelled, highlighted point instead — every
// other city's name shows only on hover or focus of its own dot (board
// feedback, 2026-08-20), an SVG <text> label can't do that on its own, so
// each name is a small HTML tooltip living in the same overlay div as its
// link, not inside the SVG.
export function GermanyMap() {
  const t = useTranslations("EventsNetwork");

  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative mx-auto w-full max-w-md"
        style={{ aspectRatio: `${VIEWBOX_WIDTH} / ${VIEWBOX_HEIGHT}` }}
      >
        <svg
          role="img"
          aria-label={t("mapTitle")}
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="absolute inset-0 h-full w-full"
        >
          <path
            d={OUTLINE_PATH}
            aria-hidden="true"
            fill="var(--color-ink)"
            fillOpacity={0.05}
            stroke="var(--color-ink)"
            strokeOpacity={0.15}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />

          {germanTeamCities.map((cityEntry) => {
            const point = CITY_POINTS[cityEntry.key];
            return (
              <circle
                key={cityEntry.key}
                aria-hidden="true"
                cx={point.x}
                cy={point.y}
                r={CITY_DOT_RADIUS}
                fill="var(--color-gold)"
                // Straubing has no confirmed URL (ASSETS-TODO.md — its
                // listed site 404s) — dimmed exactly like the pre-linking
                // design's unlinked dots, a real visual cue that this one
                // isn't clickable, not just an absent tooltip a mouse user
                // would only discover by hovering every single dot.
                fillOpacity={cityEntry.url ? 1 : 0.55}
              />
            );
          })}

          <g aria-hidden="true">
            <circle
              cx={MANNHEIM_POINT.x}
              cy={MANNHEIM_POINT.y}
              r={MANNHEIM_DOT_RADIUS}
              fill="var(--color-gold)"
              stroke="var(--color-ink)"
              strokeWidth={1.5}
            />
            <text
              x={MANNHEIM_POINT.x + MANNHEIM_DOT_RADIUS + 5}
              y={MANNHEIM_POINT.y + 4}
              className="font-mono text-mono-s uppercase"
              fill="var(--color-ink)"
            >
              {t("mapMannheimLabel")}
            </text>
          </g>
        </svg>

        {germanTeamCities.map((cityEntry) => {
          const point = CITY_POINTS[cityEntry.key];
          const leftPercent = (point.x / VIEWBOX_WIDTH) * 100;
          const topPercent = (point.y / VIEWBOX_HEIGHT) * 100;
          // Labels for a dot in the map's right half open to the left
          // instead of the right, so the tooltip stays inside the map's
          // own box instead of running off its edge (Berlin, at 81% of
          // the viewBox width, is the real case this matters for).
          const opensLeft = point.x > VIEWBOX_WIDTH / 2;
          const label = (
            <span
              aria-hidden="true"
              className={[
                "pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm border border-ink/10 bg-paper px-1.5 py-0.5 font-mono text-mono-xs uppercase text-ink opacity-0 shadow-sm transition-opacity duration-[var(--duration-fast)] ease-signature",
                "group-hover:opacity-100 group-focus-within:opacity-100",
                opensLeft ? "right-full mr-2" : "left-full ml-2",
              ].join(" ")}
            >
              {cityEntry.name}
            </span>
          );

          if (!cityEntry.url) {
            // No confirmed link (Straubing) — still hoverable (the group
            // itself carries the hover state), but nothing for a keyboard
            // user to focus here, since there's nothing to activate. The
            // name is still reachable via the always-visible list below.
            return (
              <div
                key={cityEntry.key}
                className="group absolute size-6 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
              >
                {label}
              </div>
            );
          }

          return (
            <a
              key={cityEntry.key}
              href={cityEntry.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("teamLinkLabel", { name: cityEntry.name })}
              className="group absolute block size-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
            >
              {label}
            </a>
          );
        })}
      </div>

      {/* Every name in one place a reader doesn't have to hover 23 tiny
          dots to see — the map's own hover/focus labels (above) are an
          enhancement for a reader who already knows roughly where to
          look, never the only way to reach a name (design-system.md:
          "hover enhances, hover never hides"). */}
      <div className="flex flex-col gap-3">
        <Eyebrow>{t("moreLocationsHeading")}</Eyebrow>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-body-s text-ink/70 sm:grid-cols-3">
          {germanTeamCities.map((cityEntry) => (
            <li key={cityEntry.key}>{cityEntry.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
