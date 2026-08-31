"use client";

import { useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export type CheckboxGroupOption = { value: string; label: string };

type CheckboxGroupProps = {
  legend: string;
  hint?: string;
  error?: string;
  options: CheckboxGroupOption[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Once reached, every unchecked box disables rather than the group
      silently refusing a click — a board asked for the cap specifically so
      the signal stays meaningful, and a disabled box (plus the live count
      below) tells a visitor why, rather than nothing happening. A checked
      box stays enabled so unchecking to free up a slot always works. */
  max?: number;
  /** "N of max selected", already localized by the caller (this primitive
      has no i18n of its own, same as Field.tsx) — announced via
      aria-live="polite" so reaching the cap is heard, not just seen. */
  countLabel?: string;
  className?: string;
};

/**
 * An optional, unranked checkbox set — the Ressort/department pattern the
 * Wunschbereich dropdowns don't fit, since those bind one priority per
 * control. No precedent for this shape in ui/ yet: every checkbox on this
 * site so far is a single hand-rolled `<label><input type="checkbox">`
 * (consent, honeypot-adjacent toggles, admin `active` flags) — this is the
 * first one governing more than one related option at once.
 */
export function CheckboxGroup({ legend, hint, error, options, value, onChange, max, countLabel, className }: CheckboxGroupProps) {
  const generatedId = useId();
  const errorId = error ? `${generatedId}-error` : undefined;
  const atMax = typeof max === "number" && value.length >= max;

  function toggle(optionValue: string, checked: boolean) {
    if (checked) {
      if (atMax) return;
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter((entry) => entry !== optionValue));
    }
  }

  return (
    <fieldset className={cn("flex flex-col gap-3", className)}>
      <legend className="text-body-s font-medium text-ink">{legend}</legend>
      {hint && !error && <p className="text-body-s opacity-60">{hint}</p>}
      {countLabel && (
        <p className="text-body-s opacity-60 tabular-nums" aria-live="polite">
          {countLabel}
        </p>
      )}
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const checked = value.includes(option.value);
          const disabled = !checked && atMax;
          return (
            <label
              key={option.value}
              className={cn("flex items-start gap-3 text-body-s", disabled && "opacity-50")}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                aria-invalid={Boolean(error)}
                aria-describedby={errorId}
                onChange={(event) => toggle(option.value, event.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-ink/20 focus-visible:outline-2 focus-visible:outline-offset-2"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="flex items-center gap-2 text-body-s text-oxblood">
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
