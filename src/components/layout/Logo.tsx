import { useTranslations } from "next-intl";
import { PlaceholderMark } from "@/components/ui/PlaceholderMark";
import { cn } from "@/lib/cn";

export type LogoVariant = "full" | "compact";

export type LogoProps = {
  variant?: LogoVariant;
  className?: string;
};

/**
 * Missing asset — see ASSETS-TODO.md. Built on PlaceholderMark rather than a
 * hand-rolled dashed-gold box, so the placeholder language stays one system
 * across the site (docs/design-system.md: "one motif, carried
 * consistently"). No hardcoded text color: it inherits `currentColor`, so it
 * reads correctly wherever it's placed — on paper, on the Footer's ink
 * surface (via the explicit override below), or over a transparent header
 * once one exists. Purely decorative — the wrapping <Link> carries the
 * accessible name ("Zur Startseite" / "Go to homepage"), so this stays
 * aria-hidden; PlaceholderMark's own title/sr-only hint is inert here, not
 * an omission.
 */
export function Logo({ variant = "full", className }: LogoProps) {
  const t = useTranslations("Placeholder");
  return (
    <span aria-hidden="true">
      <PlaceholderMark
        variant="missing"
        hint={t("missingHint")}
        className={cn(
          "h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-md border-2 px-3 py-0 font-mono text-mono-s uppercase",
          variant === "compact" && "aspect-square px-0",
          className,
        )}
      >
        {variant === "full" ? "Enactus Mannheim" : "EM"}
      </PlaceholderMark>
    </span>
  );
}
