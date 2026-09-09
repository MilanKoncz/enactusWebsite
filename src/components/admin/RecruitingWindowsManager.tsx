"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminRowActions } from "@/components/admin/AdminRowActions";
import { SendReminderWindowMailButton } from "@/components/admin/SendReminderWindowMailButton";
import { recruitingWindowFormSchema } from "@/lib/recruitingWindowFormSchema";
import { siteDateTimeFormatter } from "@/lib/formatSiteDateTime";
import { generateInterviewSlots, MAX_INTERVIEW_DAYS } from "@/lib/interviewSlots";

export type ManagedWindow = {
  id: string;
  semester: string;
  start: string;
  end: string;
  startWallClock: string;
  endWallClock: string;
  interviewDays: string[];
  interviewStartTime: string;
  interviewEndTime: string;
  interviewSlotMinutes: number;
};

type Draft = {
  semester: string;
  start: string;
  end: string;
  interviewDays: string[];
  interviewStartTime: string;
  interviewEndTime: string;
  // Kept as the raw string a number input produces, not a number — the
  // same reason applicationFormSchema.ts's Input/Output split exists,
  // except this component has no react-hook-form resolver to do that
  // coercion for it; recruitingWindowFormSchema's z.coerce.number() does
  // it instead, at parse time.
  interviewSlotMinutes: string;
};

// Board-facing defaults, not a guess: 10-19 Uhr, 60-Minuten-Slots is the
// range this feature was commissioned for (see the plan's own brief), and
// a brand-new window with no interview days configured yet should still
// show a sensible starting point rather than empty inputs.
const EMPTY_DRAFT: Draft = {
  semester: "",
  start: "",
  end: "",
  interviewDays: [],
  interviewStartTime: "10:00",
  interviewEndTime: "19:00",
  interviewSlotMinutes: "60",
};

type DraftFieldError = Partial<Record<keyof Draft, string>>;

// One client component for the whole section rather than a form component
// plus a row component plus a delete button: the three actions share the
// same error surface and the same "re-read from the server afterwards"
// step, and splitting them would mean lifting all of that state up anyway.
export function RecruitingWindowsManager({ windows }: { windows: ManagedWindow[] }) {
  const t = useTranslations("Admin.recruitingWindows");
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<DraftFieldError>({});

  function resetForm() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setFieldErrors({});
    setError(null);
  }

  function startEditing(window: ManagedWindow) {
    setEditingId(window.id);
    setDraft({
      semester: window.semester,
      start: window.startWallClock,
      end: window.endWallClock,
      interviewDays: window.interviewDays,
      interviewStartTime: window.interviewStartTime,
      interviewEndTime: window.interviewEndTime,
      interviewSlotMinutes: String(window.interviewSlotMinutes),
    });
    setFieldErrors({});
    setError(null);
  }

  function addInterviewDay() {
    setDraft({ ...draft, interviewDays: [...draft.interviewDays, ""] });
  }

  function updateInterviewDay(index: number, value: string) {
    const next = [...draft.interviewDays];
    next[index] = value;
    setDraft({ ...draft, interviewDays: next });
  }

  function removeInterviewDay(index: number) {
    setDraft({ ...draft, interviewDays: draft.interviewDays.filter((_, i) => i !== index) });
  }

  // A row the board added but hasn't picked a date for yet is dropped
  // silently rather than rejected — it was never a day they meant to
  // configure, just an empty control waiting to be filled in.
  const configuredInterviewDays = draft.interviewDays.filter((day) => day.trim().length > 0);
  const interviewSlotCount = generateInterviewSlots({
    days: configuredInterviewDays,
    startTime: draft.interviewStartTime,
    endTime: draft.interviewEndTime,
    slotMinutes: Number(draft.interviewSlotMinutes) || 0,
  }).length;

  // Reports the server's own reason rather than one generic message: the
  // two conflicts a board member can actually cause (an overlapping range,
  // a semester label already in use) need different corrections.
  function describeFailure(body: unknown): string {
    if (body && typeof body === "object" && "error" in body) {
      const code = (body as { error?: unknown }).error;
      if (code === "overlaps") {
        const semester = (body as { semester?: unknown }).semester;
        return typeof semester === "string" ? t("errorOverlapsWith", { semester }) : t("errorOverlaps");
      }
      if (code === "duplicate_semester") return t("errorDuplicateSemester");
    }
    return t("errorGeneric");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // The same schema the route runs, so a mistake is caught before a
    // round trip — never instead of one. interviewDays is sent already
    // filtered of the empty rows a board member added but hasn't picked a
    // date for yet, same as the live slot count above.
    const parsed = recruitingWindowFormSchema.safeParse({ ...draft, interviewDays: configuredInterviewDays });
    if (!parsed.success) {
      const next: DraftFieldError = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "semester") next.semester = t("errorSemesterFormat");
        if (key === "end") next.end = t("errorEndBeforeStart");
        if (key === "start") next.start = t("errorDateRequired");
        if (key === "interviewDays") {
          next.interviewDays =
            issue.code === "too_big" ? t("errorInterviewTooManyDays", { max: MAX_INTERVIEW_DAYS }) : t("errorInterviewDuplicateDay");
        }
        if (key === "interviewStartTime" || key === "interviewEndTime") {
          next.interviewEndTime = t("errorInterviewRange");
        }
        if (key === "interviewSlotMinutes") next.interviewSlotMinutes = t("errorInterviewSlotMinutes");
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    setPending(true);

    try {
      const response = await fetch(
        editingId ? `/api/admin/bewerbungsfenster/${editingId}` : "/api/admin/bewerbungsfenster",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );

      if (!response.ok) {
        setError(describeFailure(await response.json().catch(() => null)));
        return;
      }

      resetForm();
      router.refresh();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(window: ManagedWindow) {
    // A window is a date the public site renders; deleting one silently on
    // a stray click would change what /mitmachen says with no way to tell
    // it happened.
    if (!confirm(t("confirmDelete", { semester: window.semester }))) return;

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/bewerbungsfenster/${window.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError(t("errorGeneric"));
        return;
      }
      if (editingId === window.id) resetForm();
      router.refresh();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setPending(false);
    }
  }

  // Pinned to Europe/Berlin (see formatSiteDateTime's own comment) — this
  // table used to render in the admin's own browser zone, which disagreed
  // with the edit form directly below it (pre-filled from startWallClock/
  // endWallClock, already Berlin) whenever the admin wasn't sitting in
  // Germany. Same instant, two different times on one screen.
  const dateFormatter = siteDateTimeFormatter("de-DE", { dateStyle: "medium", timeStyle: "short" });

  function interviewSummary(window: ManagedWindow): string {
    if (window.interviewDays.length === 0) return t("interviewNone");
    const slotCount = generateInterviewSlots({
      days: window.interviewDays,
      startTime: window.interviewStartTime,
      endTime: window.interviewEndTime,
      slotMinutes: window.interviewSlotMinutes,
    }).length;
    return t("interviewSummary", {
      days: window.interviewDays.length,
      start: window.interviewStartTime,
      end: window.interviewEndTime,
      minutes: window.interviewSlotMinutes,
      slots: slotCount,
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <AdminTable
        columns={[t("columns.semester"), t("columns.start"), t("columns.end"), t("columns.interviewDays"), t("columns.action")]}
        empty={t("empty")}
        minWidthClassName="min-w-[800px]"
        rows={windows.map((window) => ({
          key: window.id,
          cells: [
            window.semester,
            dateFormatter.format(new Date(window.start)),
            dateFormatter.format(new Date(window.end)),
            interviewSummary(window),
            <AdminRowActions key="actions">
              <Button variant="ghost" size="sm" onClick={() => startEditing(window)} disabled={pending}>
                {t("edit")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(window)} disabled={pending}>
                {t("delete")}
              </Button>
              <SendReminderWindowMailButton windowId={window.id} semester={window.semester} />
            </AdminRowActions>,
          ],
        }))}
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 border-t border-ink/10 pt-8">
        <h2 className="text-heading-3 font-display font-normal!">{editingId ? t("editHeading") : t("createHeading")}</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Field
            label={t("semesterLabel")}
            hint={t("semesterHint")}
            value={draft.semester}
            onChange={(event) => setDraft({ ...draft, semester: event.target.value.toUpperCase() })}
            error={fieldErrors.semester}
          />
          <Field
            label={t("startLabel")}
            hint={t("startHint")}
            type="datetime-local"
            value={draft.start}
            onChange={(event) => setDraft({ ...draft, start: event.target.value })}
            error={fieldErrors.start}
          />
          <Field
            label={t("endLabel")}
            hint={t("endHint")}
            type="datetime-local"
            value={draft.end}
            onChange={(event) => setDraft({ ...draft, end: event.target.value })}
            error={fieldErrors.end}
          />
        </div>

        <p className="text-body-s opacity-60">{t("timezoneNote")}</p>

        <fieldset className="flex flex-col gap-4 border-t border-ink/10 pt-6">
          <legend className="text-body-m font-medium text-ink">{t("interviewHeading")}</legend>
          <p className="text-body-s opacity-60">{t("interviewLead")}</p>

          <div className="flex flex-col gap-2">
            {draft.interviewDays.map((day, index) => (
              <div key={index} className="flex items-end gap-3">
                <Field
                  label={t("interviewDayLabel", { position: index + 1 })}
                  type="date"
                  value={day}
                  onChange={(event) => updateInterviewDay(index, event.target.value)}
                  containerClassName="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeInterviewDay(index)}
                  aria-label={t("removeInterviewDay", { position: index + 1 })}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            ))}
            {fieldErrors.interviewDays && (
              <p className="text-body-s text-oxblood">{fieldErrors.interviewDays}</p>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={addInterviewDay}
              disabled={draft.interviewDays.length >= MAX_INTERVIEW_DAYS}
            >
              {t("addInterviewDay")}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Field
              label={t("interviewStartLabel")}
              type="time"
              value={draft.interviewStartTime}
              onChange={(event) => setDraft({ ...draft, interviewStartTime: event.target.value })}
            />
            <Field
              label={t("interviewEndLabel")}
              type="time"
              value={draft.interviewEndTime}
              onChange={(event) => setDraft({ ...draft, interviewEndTime: event.target.value })}
              error={fieldErrors.interviewEndTime}
            />
            <Field
              label={t("interviewSlotMinutesLabel")}
              type="number"
              min={1}
              value={draft.interviewSlotMinutes}
              onChange={(event) => setDraft({ ...draft, interviewSlotMinutes: event.target.value })}
              error={fieldErrors.interviewSlotMinutes}
            />
          </div>

          <p className="text-body-s opacity-60 tabular-nums" aria-live="polite">
            {t("interviewSlotSummary", {
              count: interviewSlotCount,
              perDay: configuredInterviewDays.length > 0 ? interviewSlotCount / configuredInterviewDays.length : 0,
            })}
          </p>
        </fieldset>

        {error && <FormStatusMessage variant="error">{error}</FormStatusMessage>}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={pending} className="self-start">
            {editingId ? t("saveChanges") : t("create")}
          </Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={resetForm} disabled={pending}>
              {t("cancelEdit")}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
