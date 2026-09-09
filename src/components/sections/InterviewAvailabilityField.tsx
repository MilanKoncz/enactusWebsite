"use client";

import { AlertCircle } from "lucide-react";
import { CheckboxGroup } from "@/components/ui/CheckboxGroup";
import type { InterviewSlot } from "@/lib/interviewSlots";

type InterviewAvailabilityFieldProps = {
  legend: string;
  hint: string;
  countLabel: string;
  slots: InterviewSlot[];
  value: string[];
  onChange: (value: string[]) => void;
  dayHeading: (day: string) => string;
  slotLabel: (slot: InterviewSlot) => string;
  error?: string;
};

/**
 * Groups the offered interview slots by day, one CheckboxGroup per day
 * inside an outer fieldset — see CheckboxGroup's own comment on why a flat
 * 18-option list doesn't read well at this size, and
 * applicationFormSchema.ts's own comment on why there's no per-applicant
 * cap here, unlike departments: several interviews run in parallel, so any
 * number of slots may genuinely work for someone.
 *
 * Renders nothing when no slots are offered — a window with no interview
 * days configured yet, or none currently open — rather than an empty
 * fieldset with nothing to check.
 *
 * Formatting (day headings, per-slot labels) is supplied by the caller,
 * the same "no i18n of its own" contract CheckboxGroup and Field.tsx
 * already follow.
 */
export function InterviewAvailabilityField({
  legend,
  hint,
  countLabel,
  slots,
  value,
  onChange,
  dayHeading,
  slotLabel,
  error,
}: InterviewAvailabilityFieldProps) {
  if (slots.length === 0) return null;

  const byDay = new Map<string, InterviewSlot[]>();
  for (const slot of slots) {
    const existing = byDay.get(slot.day);
    if (existing) existing.push(slot);
    else byDay.set(slot.day, [slot]);
  }

  function toggleDay(daySlots: InterviewSlot[], nextDayValue: string[]) {
    const dayValues = new Set(daySlots.map((slot) => slot.value));
    const withoutDay = value.filter((entry) => !dayValues.has(entry));
    onChange([...withoutDay, ...nextDayValue]);
  }

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-body-s font-medium text-ink">{legend}</legend>
      <p className="text-body-s opacity-60">{hint}</p>
      <p className="text-body-s opacity-60 tabular-nums" aria-live="polite">
        {countLabel}
      </p>
      <div className="flex flex-col gap-6">
        {Array.from(byDay.entries()).map(([day, daySlots]) => {
          const dayValue = value.filter((entry) => daySlots.some((slot) => slot.value === entry));
          return (
            <CheckboxGroup
              key={day}
              legend={dayHeading(day)}
              options={daySlots.map((slot) => ({ value: slot.value, label: slotLabel(slot) }))}
              value={dayValue}
              onChange={(nextDayValue) => toggleDay(daySlots, nextDayValue)}
              columns={2}
            />
          );
        })}
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-2 text-body-s text-oxblood">
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
