import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Link, type LinkProps } from "@/lib/navigation";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "glass";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonAsButtonProps = ButtonOwnProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof ButtonOwnProps | "href"> & {
    href?: undefined;
  };

type ButtonAsLinkProps = ButtonOwnProps &
  Omit<LinkProps, keyof ButtonOwnProps> &
  Omit<ComponentPropsWithoutRef<"a">, keyof ButtonOwnProps | keyof LinkProps> & {
    href: LinkProps["href"];
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "btn-shine-host bg-gold text-ink hover:bg-gold/90 active:bg-gold/80",
  secondary: "border border-ink text-ink bg-transparent hover:bg-ink/5 active:bg-ink/10",
  ghost: "text-ink bg-transparent hover:bg-ink/5 active:bg-ink/10",
  // Only for use over photography or a dark, full-bleed (data-surface="ink") section —
  // the translucency reads as noise on --color-paper. backdrop-saturate lifts
  // whatever's behind it rather than just dimming it; the inset shadow pair
  // (docs/design-system.md's "hairline light edge on top, faint inner shadow
  // underneath") is what reads as glass rather than a flat tinted panel.
  glass:
    "border border-paper/40 bg-paper/10 text-paper backdrop-blur-md backdrop-saturate-150 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),inset_0_-14px_20px_-18px_rgba(0,0,0,0.4)] hover:border-paper/60 hover:bg-paper/20 active:bg-paper/30",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "gap-2 px-4 py-1 text-body-s",
  // min-h-11 (44px) is the touch-target floor this size is checked
  // against — its own padding alone rounds to 42px, 2px short.
  md: "min-h-11 gap-2 px-6 py-2 text-body-m",
  lg: "gap-3 px-10 py-3 text-body-l",
};

const SPINNER_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

// Hover/active transforms are a scale + a 1px lift, never a size change on
// the box itself — docs/design-system.md's Interaction section: no layout
// shift. Focus-visible gets the identical transform as hover, not a lesser
// one. `relative overflow-hidden` is what lets the primary variant's shine
// span (below) travel across the fill without spilling past its rounded
// corners; it's harmless on every other variant, which never renders one.
const BASE_CLASSES =
  "group relative inline-flex items-center justify-center overflow-hidden rounded-md font-sans font-medium transition-[background-color,border-color,color,transform] duration-[var(--duration-fast)] ease-signature hover:-translate-y-px hover:scale-[1.02] focus-visible:-translate-y-px focus-visible:scale-[1.02] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

// The primary variant's one-shot shine: transitions only in the hover/focus
// direction (globals.css's .btn-shine-host rule pins the resting transform to
// `transition: transform 0s`), so it snaps back into position the instant the
// pointer leaves instead of visibly sweeping backward — "einmal über die
// Fläche wandert", not a loop.
const SHINE_CLASSES =
  "btn-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-paper/50 to-transparent";

// Exported standalone for the rare case of a real, plain `<a href="mailto:...">`
// that needs Button's exact look without going through Button itself — Button
// always renders through next-intl's `Link` for its href branch
// (lib/navigation.ts), which is built for internal app routes and wrong for
// a mailto: link (see PartnerContact.tsx, which is the one place that needs
// this). Callers get the base/variant/size classes only, not the primary
// variant's shine sweep — that effect needs its own inner `<span>` element
// (SHINE_CLASSES below), which only Button itself renders.
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button({ variant = "primary", size = "md", loading = false, className, children, ...rest }, ref) {
    const sharedClassName = buttonClasses(variant, size, className);

    const content = (
      <>
        {variant === "primary" && <span aria-hidden="true" className={SHINE_CLASSES} />}
        {loading && (
          <Loader2 aria-hidden="true" className={cn("animate-spin", SPINNER_SIZE_CLASSES[size])} />
        )}
        {children}
      </>
    );

    if (rest.href !== undefined) {
      const { href, onClick, ...linkRest } = rest as Omit<ButtonAsLinkProps, keyof ButtonOwnProps>;
      const disabled = loading;

      if (disabled) {
        return (
          <a
            ref={ref as Ref<HTMLAnchorElement>}
            aria-disabled="true"
            aria-busy={loading}
            tabIndex={-1}
            className={sharedClassName}
            onClick={(event) => event.preventDefault()}
          >
            {content}
          </a>
        );
      }

      return (
        <Link
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          onClick={onClick}
          className={sharedClassName}
          {...linkRest}
        >
          {content}
        </Link>
      );
    }

    const { disabled, ...buttonRest } = rest as Omit<ButtonAsButtonProps, keyof ButtonOwnProps>;
    const isDisabled = Boolean(disabled) || loading;

    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={buttonRest.type ?? "button"}
        disabled={isDisabled}
        aria-busy={loading}
        className={sharedClassName}
        {...buttonRest}
      >
        {content}
      </button>
    );
  },
);
