import type { ReactNode } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

export type FormStatusMessageProps = {
  variant: "success" | "error";
  children: ReactNode;
  className?: string;
};

// Shared success/error treatment for every form on the site (Bewerbung,
// Kontakt, Erinnerung) — a confirmation used to look identical to a
// PlaceholderMark (a dashed gold border, no color, no icon), which read as
// "nothing happened" rather than "it worked". moss/oxblood are the same
// tokens Badge already uses for active/cancelled — one success color and
// one error color across the whole site, not a form-specific palette.
// role is tied to the variant, not a separate prop: a success confirmation
// is `status` (announced politely, whenever the screen reader is next
// idle), an error is `alert` (announced immediately) — the two are never
// interchangeable per WAI-ARIA, so there is no case where a caller should
// need to override it.
const VARIANT_CLASSES: Record<FormStatusMessageProps["variant"], string> = {
  success: "border-moss/50 bg-moss/5 text-moss",
  error: "border-oxblood/50 bg-oxblood/5 text-oxblood",
};

const VARIANT_ICONS: Record<FormStatusMessageProps["variant"], typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertTriangle,
};

export function FormStatusMessage({ variant, children, className }: FormStatusMessageProps) {
  const Icon = VARIANT_ICONS[variant];
  return (
    <div
      role={variant === "success" ? "status" : "alert"}
      className={cn(
        "flex items-start gap-3 rounded-md border-l-2 py-3 pr-4 pl-4 text-body-m",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
