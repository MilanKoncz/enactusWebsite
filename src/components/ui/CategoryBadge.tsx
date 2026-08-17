import type { ComponentPropsWithoutRef } from "react";
import { GraduationCap, Lightbulb, PartyPopper, Plane, Rocket, Trophy, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CalendarCategory } from "@/content/calendar";
import { cn } from "@/lib/cn";

const CATEGORY_ICON: Record<CalendarCategory, typeof Lightbulb> = {
  innolab: Lightbulb,
  projekte: Rocket,
  journeys: Plane,
  wettkaempfe: Trophy,
  socials: PartyPopper,
  workshops: GraduationCap,
  bewerbung: UserPlus,
};

// wettkaempfe is the one filled category (gold fill, ink text — gold is
// never a text color on paper, docs/design-system.md); every other category
// is its own color as text plus a hairline border, the same fill-vs-outline
// split Badge.tsx uses for project status. Color is never the only signal
// here either: the icon and the category name both carry the same
// information a colorblind reader would otherwise lose.
const CATEGORY_CLASSES: Record<CalendarCategory, string> = {
  innolab: "border border-cal-innolab/40 text-cal-innolab",
  projekte: "border border-cal-projekte/40 text-cal-projekte",
  journeys: "border border-cal-journeys/40 text-cal-journeys",
  wettkaempfe: "bg-cal-wettkaempfe text-ink",
  socials: "border border-cal-socials/40 text-cal-socials",
  workshops: "border border-cal-workshops/40 text-cal-workshops",
  bewerbung: "border border-cal-bewerbung/40 text-cal-bewerbung",
};

// A past wettkaempfe event keeps its gold fill — dropping it the way the
// six outline categories mute (losing their fill, which they never had) is
// not available here: gold as bare text on paper measures 1.47:1, so
// removing the fill would leave the one filled category illegible instead
// of dim. ink/70 is used instead of the site's usual ink/60 for muted text:
// measured against this particular fill, ink/60 is 4.30:1 (fails AA),
// ink/70 is 5.78:1 (tests/unit/contrast.test.ts covers both figures). The
// outline categories mute by dimming the row's title/meta text to ink/60 on
// the surrounding paper instead — that happens in the row, not in this
// badge, so their own color and icon stay at full strength.
const PAST_WETTKAEMPFE_CLASSES = "bg-cal-wettkaempfe text-ink/70";

/**
 * A category's color as a left-edge accent border — the gate-marker motif
 * (docs/design-system.md) applied to the highlighted next-event card.
 * Exported as a static, fully-spelled-out map rather than built from a
 * template string (`` `border-l-cal-${category}` ``): Tailwind's scanner
 * only picks up class names it can see literally in source, so an
 * interpolated one would compile to nothing.
 */
export const CATEGORY_LEFT_BORDER_CLASS: Record<CalendarCategory, string> = {
  innolab: "border-l-cal-innolab",
  projekte: "border-l-cal-projekte",
  journeys: "border-l-cal-journeys",
  wettkaempfe: "border-l-cal-wettkaempfe",
  socials: "border-l-cal-socials",
  workshops: "border-l-cal-workshops",
  bewerbung: "border-l-cal-bewerbung",
};

export type CategoryBadgeProps = {
  category: CalendarCategory;
  /** The event this badge labels is in the past — see the comment above. */
  past?: boolean;
} & Omit<ComponentPropsWithoutRef<"span">, "children">;

export function CategoryBadge({ category, past = false, className, ...props }: CategoryBadgeProps) {
  const t = useTranslations("CalendarCategories");
  const Icon = CATEGORY_ICON[category];
  const isWettkaempfe = category === "wettkaempfe";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 py-1 font-mono text-mono-xs uppercase",
        past && isWettkaempfe ? PAST_WETTKAEMPFE_CLASSES : CATEGORY_CLASSES[category],
        className,
      )}
      {...props}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {t(category)}
    </span>
  );
}
