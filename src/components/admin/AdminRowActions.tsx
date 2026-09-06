import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * Reserves width for the widest of several possible labels by stacking every
 * one of them in the same grid cell — the current one visible, the rest
 * `invisible` (occupies layout space, painted nothing) and `aria-hidden`
 * (excluded from the accessible name) — so a label change can never resize
 * its own footprint and push whatever renders after it in the same row.
 *
 * This is the actual fix for the admin table row-action misalignment: a
 * real `<table>` already sizes every column uniformly (`AdminTable.tsx`), so
 * the status column was never the cause — measured in a real browser
 * (`/admin/ressorts`, `/admin/wunschbereiche`), the status cell's width is
 * identical across every row regardless of "aktiv" vs "inaktiv". The actual
 * shift comes from inside the action cell: "Aktivieren" (98.4px measured)
 * and "Deaktivieren" (114.9px measured) are different widths, and every
 * button after the toggle in that flex row inherits the difference. Real
 * rendered text width, not a guessed ch/px value, so it holds for whatever
 * a future translation measures out to as well.
 */
export function ReservedLabel({ current, others }: { current: string; others: readonly string[] }) {
  return (
    <span className="grid">
      <span className="col-start-1 row-start-1 whitespace-nowrap">{current}</span>
      {others
        .filter((label) => label !== current)
        .map((label) => (
          <span key={label} aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-nowrap">
            {label}
          </span>
        ))}
    </span>
  );
}

/**
 * A toggle button (Aktivieren/Deaktivieren, say) whose own width never
 * changes between its two states — see `ReservedLabel` above for why that
 * matters to every button rendered after it in the same `AdminRowActions`.
 */
export function AdminToggleButton({
  current,
  labels,
  onClick,
  disabled,
}: {
  current: string;
  labels: readonly string[];
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={disabled}>
      <ReservedLabel current={current} others={labels} />
    </Button>
  );
}

/**
 * The one wrapper for an `AdminTable` action cell's row of buttons —
 * replaces three ad hoc variants (`flex flex-wrap gap-2`, `flex gap-2`,
 * `flex flex-wrap items-center gap-2`) that had drifted across the five
 * managers with no reason for the difference. `items-center` matters once a
 * row mixes a `Button` with a differently-sized element (a link, a badge).
 */
export function AdminRowActions({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("flex flex-wrap items-center gap-2", className)}>{children}</span>;
}
