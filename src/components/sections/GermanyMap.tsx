import { useTranslations } from "next-intl";
import { teamLinks, type TeamKey } from "@/content/network";

// A self-drawn, heavily simplified silhouette of Germany — no third-party
// map data, no map tile provider, no runtime request. Ten straight-line
// vertices, just enough to read as the country's outline (the Baltic/North
// Sea coast in the north, the Saxon bulge east, the Alpine edge south, the
// Rhine-valley indent west) at the scale a small in-page graphic is ever
// seen. Not a survey-accurate boundary — see the datenschutz non-negotiable
// this replaces a real map provider for.
const OUTLINE_PATH =
  "M140,15 L200,25 L230,70 L255,140 L230,250 L190,380 L110,390 L55,300 L30,230 L25,160 L30,100 L60,50 L100,25 Z";

const VIEWBOX_WIDTH = 300;
const VIEWBOX_HEIGHT = 410;

// Hand-placed to read as roughly the right position relative to each other
// and to the outline above, not digitised from a real coordinate source —
// presentation detail, so it lives here rather than in content/network.ts
// (see that file's comment on the same six locations).
const MANNHEIM_POINT = { x: 90, y: 240 };
const TEAM_POINTS: Record<TeamKey, { x: number; y: number }> = {
  muenchen: { x: 175, y: 330 },
  muenster: { x: 85, y: 135 },
  hamburg: { x: 135, y: 75 },
  koeln: { x: 65, y: 180 },
  karlsruhe: { x: 88, y: 262 },
};

const MANNHEIM_DOT_RADIUS = 7;
const TEAM_DOT_RADIUS = 4;

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
      className="relative mx-auto w-full max-w-[240px]"
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
