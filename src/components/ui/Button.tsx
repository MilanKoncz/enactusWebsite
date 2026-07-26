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
  primary: "bg-gold text-ink hover:bg-gold/90 active:bg-gold/80",
  secondary: "border border-ink text-ink bg-transparent hover:bg-ink/5 active:bg-ink/10",
  ghost: "text-ink bg-transparent hover:bg-ink/5 active:bg-ink/10",
  // Only for use over photography or a dark, full-bleed (data-surface="ink") section —
  // the translucency reads as noise on --color-paper.
  glass:
    "border border-paper/30 bg-paper/10 text-paper backdrop-blur-md hover:bg-paper/20 active:bg-paper/30",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "gap-2 px-4 py-1 text-body-s",
  md: "gap-2 px-6 py-2 text-body-m",
  lg: "gap-3 px-10 py-3 text-body-l",
};

const SPINNER_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-md font-sans font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button({ variant = "primary", size = "md", loading = false, className, children, ...rest }, ref) {
    const sharedClassName = cn(BASE_CLASSES, VARIANT_CLASSES[variant], SIZE_CLASSES[size], className);

    const content = (
      <>
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
