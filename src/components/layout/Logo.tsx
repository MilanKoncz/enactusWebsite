import Image from "next/image";
import { cn } from "@/lib/cn";

export type LogoVariant = "full" | "compact";

// Which surface the logo sits against — same vocabulary as Section's
// `surface` prop. "paper" picks the dark-wordmark asset (Header's default,
// scrolled state); "ink" picks the recolored-for-dark asset (Footer,
// MobileMenu, and the Header while it floats transparent over the homepage
// hero). Unlike the old placeholder, a raster logo can't just inherit
// `currentColor`, so callers now have to say which surface they're on.
export type LogoSurface = "paper" | "ink";

export type LogoProps = {
  variant?: LogoVariant;
  surface?: LogoSurface;
  className?: string;
};

// Real assets from the previous site (enactus-mannheim.com), fetched
// 2026-07-29 as PNGs — see ASSETS-TODO.md for the outstanding SVG request.
// Both a black-text and a white-text export of the full wordmark already
// existed there (for that site's light and yellow/dark section backgrounds
// respectively), so "ink" below uses that original white-text asset rather
// than a recolored copy of the black one.
const FULL_LOGO: Record<LogoSurface, { src: string; width: number; height: number }> = {
  paper: { src: "/brand/enactus-mannheim-logo-full.png", width: 1736, height: 1036 },
  ink: { src: "/brand/enactus-mannheim-logo-full-on-dark.png", width: 1736, height: 1036 },
};

// Gold mark only, transparent background — legible on both surfaces without
// a second variant, so `surface` doesn't affect this branch. Cropped from
// the black-text asset's icon corner (no ready-made standalone mark file
// existed on the old site) and re-masked to drop any stray non-gold pixels
// at the crop edge.
const MARK_LOGO = { src: "/brand/enactus-mannheim-logo-mark.png", width: 600, height: 600 };

// Purely decorative — the wrapping <Link> carries the accessible name
// ("Zur Startseite" / "Go to homepage"), so this stays alt="".
export function Logo({ variant = "full", surface = "paper", className }: LogoProps) {
  const asset = variant === "full" ? FULL_LOGO[surface] : MARK_LOGO;
  return (
    <Image
      src={asset.src}
      alt=""
      width={asset.width}
      height={asset.height}
      className={cn("h-10 w-auto shrink-0 object-contain", variant === "compact" && "aspect-square", className)}
    />
  );
}
