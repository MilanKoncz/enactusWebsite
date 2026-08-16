import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

export type LinkCardProps = {
  href: string;
  title: string;
  eyebrow?: string;
  ariaLabel?: string;
  className?: string;
};

// A clear, deliberate external link — a card, not a run of underlined
// text — for the two places on the site that send a visitor somewhere
// consequential (a project's own website, a sibling Enactus team): the
// project link (title = domain) and the /events team links (title = city).
// Same lift/border-brightening as every other card (ui/Card.tsx), plus an
// arrow that nudges toward the link's own direction on hover/focus —
// enhancement, not the only way to tell it's a link, since the whole card
// is the click target and carries an accessible name regardless.
export function LinkCard({ href, title, eyebrow, ariaLabel, className }: LinkCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={cn(
        "group flex items-center justify-between gap-4 rounded-md border border-ink/10 bg-paper px-5 py-4 transition-[border-color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:border-ink/20 focus-visible:-translate-y-px focus-visible:border-ink/20",
        className,
      )}
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        {eyebrow && <span className="font-mono text-mono-xs uppercase opacity-60">{eyebrow}</span>}
        <span className="truncate text-body-m font-medium">{title}</span>
      </span>
      <ArrowUpRight
        aria-hidden="true"
        className="size-5 shrink-0 transition-transform duration-[var(--duration-fast)] ease-signature group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5"
      />
    </a>
  );
}
