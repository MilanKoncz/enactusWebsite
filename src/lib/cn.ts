import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Plain twMerge doesn't know this project's custom @theme tokens (globals.css)
// — it can't tell that "ink"/"gold"/"paper"/"sand"/"oxblood" are colors and
// "display-1"/"body-l"/"mono-s"/etc. are font sizes, so it falls back to
// guessing from the class name alone. That guess is wrong for a text-color
// custom name that happens to share the `text-` prefix with a font-size
// utility: `cn("text-ink", "text-body-l")` silently dropped `text-ink`,
// leaving every Button's variant color to fall back to whatever it inherits
// from its surface — invisible until a gold-background button ends up on an
// ink-surfaced section and inherits paper text on gold (a real WCAG
// contrast failure, caught by the homepage's e2e axe check). Registering
// the tokens below fixes the classification instead of working around it
// call-by-call.
const customTwMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "ink",
        "gold",
        "paper",
        "sand",
        "oxblood",
        "moss",
        "amber",
        // The calendar's own color layer (docs/design-system.md) — a
        // separate set of seven, not brand colors, but registered here for
        // the same reason as the five above: without this, `cn()` can
        // misclassify e.g. `text-cal-socials` against a font-size utility
        // sharing the `text-` prefix.
        "cal-innolab",
        "cal-projekte",
        "cal-journeys",
        "cal-wettkaempfe",
        "cal-socials",
        "cal-workshops",
        "cal-bewerbung",
      ],
      text: [
        "display-1",
        "display-2",
        "display-3",
        "heading-1",
        "heading-2",
        "heading-3",
        "body-l",
        "body-m",
        "body-s",
        "mono-m",
        "mono-s",
        "mono-xs",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return customTwMerge(clsx(inputs));
}
