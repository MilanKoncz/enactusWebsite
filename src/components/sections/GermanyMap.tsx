import { useTranslations } from "next-intl";
import { teamLinks, type TeamKey } from "@/content/network";

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

// Each city's real center coordinates, run through the exact same
// geoConicEqualArea projection as OUTLINE_PATH above (not eyeballed) — see
// docs/content-guide.md for the projection parameters and how to add a
// point that stays consistent with the outline. Presentation detail (pixel
// coordinates, not the underlying lon/lat facts), so it lives here rather
// than in content/network.ts — see that file's comment on the same six
// locations.
const MANNHEIM_POINT = { x: 120.7, y: 402 };
const TEAM_POINTS: Record<TeamKey, { x: number; y: number }> = {
  muenchen: { x: 266.2, y: 499.1 },
  muenster: { x: 88.6, y: 224.6 },
  hamburg: { x: 193.1, y: 113.6 },
  koeln: { x: 56, y: 296.2 },
  karlsruhe: { x: 116.8, y: 436.1 },
};

const MANNHEIM_DOT_RADIUS = 9;
const TEAM_DOT_RADIUS = 5.5;

// The team dots are real, keyboard-reachable links, laid out as siblings of
// the decorative SVG rather than inside it: an element with role="img"
// flattens its descendants into one accessible name, which would make
// interactive content inside it unreachable for a screen-reader or
// keyboard user. So the SVG (silhouette + every dot, all aria-hidden) is
// purely a picture with one describing label, and the five linked dots are
// plain <a> elements positioned on top of it at the same coordinates —
// the same href, target, and label as the text links below (teamLinkLabel),
// so a visitor gets the same destination however they navigate. Mannheim
// has no link (it's this site, not a sibling team) and stays inside the
// picture as a labelled, highlighted point instead.
export function GermanyMap() {
  const t = useTranslations("EventsNetwork");

  return (
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

        {teamLinks.map((team) => {
          const point = TEAM_POINTS[team.key];
          return (
            <g key={team.key} aria-hidden="true">
              <circle cx={point.x} cy={point.y} r={TEAM_DOT_RADIUS} fill="var(--color-gold)" />
              <text
                x={point.x + TEAM_DOT_RADIUS + 4}
                y={point.y + 3}
                className="hidden font-mono text-mono-xs uppercase sm:inline"
                fill="var(--color-ink)"
                fillOpacity={0.6}
              >
                {team.name}
              </text>
            </g>
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

      {teamLinks.map((team) => {
        if (!team.url) return null;
        const point = TEAM_POINTS[team.key];
        const leftPercent = (point.x / VIEWBOX_WIDTH) * 100;
        const topPercent = (point.y / VIEWBOX_HEIGHT) * 100;
        return (
          <a
            key={team.key}
            href={team.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("teamLinkLabel", { name: team.name })}
            className="absolute block size-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
          />
        );
      })}
    </div>
  );
}
