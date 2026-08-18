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

/**
 * A category's color as a solid block — the month grid's day bars and the
 * compact agenda's day dot both read straight from this, so a category
 * never carries a different color between the two views. Unlike
 * `CATEGORY_CLASSES` above, every category is filled here, `wettkaempfe`
 * included: a 6px bar or a small dot has no room for an outline-plus-text
 * treatment; it is the one place color really is the only signal, which is
 * fine at this size precisely because the day list underneath always spells
 * out the category name in text besides.
 */
export const CATEGORY_BAR_CLASS: Record<CalendarCategory, string> = {
  innolab: "bg-cal-innolab",
  projekte: "bg-cal-projekte",
  journeys: "bg-cal-journeys",
  wettkaempfe: "bg-cal-wettkaempfe",
  socials: "bg-cal-socials",
  workshops: "bg-cal-workshops",
  bewerbung: "bg-cal-bewerbung",
};

/** A tentative event's grid bar, outlined rather than filled — the same
 * fill-vs-outline distinction `tentative` already gets elsewhere (a dashed
 * gold border on its card/row), carried down to bar size. */
export const CATEGORY_BAR_TENTATIVE_CLASS: Record<CalendarCategory, string> = {
  innolab: "border border-cal-innolab bg-transparent",
  projekte: "border border-cal-projekte bg-transparent",
  journeys: "border border-cal-journeys bg-transparent",
  wettkaempfe: "border border-cal-wettkaempfe bg-transparent",
  socials: "border border-cal-socials bg-transparent",
  workshops: "border border-cal-workshops bg-transparent",
  bewerbung: "border border-cal-bewerbung bg-transparent",
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
        // Not uppercase, unlike this project's other mono labels
        // (docs/design-system.md's Typography section) — the one named
        // exception is "InnoLab", where forcing caps would render it as
        // "INNOLAB" and lose the mid-word capital that spells the name.
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 py-1 font-mono text-mono-xs",
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
