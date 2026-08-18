"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { AdminTable } from "@/components/admin/AdminTable";
import { calendarEventFormSchema } from "@/lib/calendarEventFormSchema";
import { CALENDAR_CATEGORIES } from "@/content/calendar";
import type { CalendarCategory } from "@/content/calendar";

export type ManagedCalendarEvent = {
  id: string;
  title: string;
  titleEn: string | null;
  category: CalendarCategory;
  startDate: string;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  description: string | null;
  descriptionEn: string | null;
  tentative: boolean;
};

type Draft = {
  title: string;
  titleEn: string;
  category: CalendarCategory;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  descriptionEn: string;
  tentative: boolean;
};

const EMPTY_DRAFT: Draft = {
  title: "",
  titleEn: "",
  category: CALENDAR_CATEGORIES[0],
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  location: "",
  description: "",
  descriptionEn: "",
  tentative: false,
};

function toDraft(event: ManagedCalendarEvent): Draft {
  return {
    title: event.title,
    titleEn: event.titleEn ?? "",
    category: event.category,
    startDate: event.startDate,
    endDate: event.endDate ?? "",
    startTime: event.startTime ?? "",
    endTime: event.endTime ?? "",
    location: event.location ?? "",
    description: event.description ?? "",
    descriptionEn: event.descriptionEn ?? "",
    tentative: event.tentative,
  };
}

/**
 * List, create, edit, and delete for /admin/termine — same one-client-
 * component shape as RecruitingWindowsManager.tsx (plain useState draft +
 * schema.safeParse, not react-hook-form, matching the rest of the admin
 * area).
 *
 * The category picker is a radio-chip group of CategoryBadge, not a native
 * `<select>`: an option element can't render an icon or a color swatch in
 * any browser, so a real dropdown could only ever show plain category
 * names. Seven fixed options is few enough that showing all of them at
 * once — each with its real icon and color, exactly like the public filter
 * chips — is both more informative and one click faster than opening a
 * dropdown, with no new dependency needed for it.
 */
export function CalendarEventsManager({ events }: { events: ManagedCalendarEvent[] }) {
  const t = useTranslations("Admin.calendarEvents");
  const tCategories = useTranslations("CalendarCategories");
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Draft, string>>>({});

  function resetForm() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setFieldErrors({});
    setError(null);
  }

  function startEditing(event: ManagedCalendarEvent) {
    setEditingId(event.id);
    setDraft(toDraft(event));
    setFieldErrors({});
    setError(null);
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError(null);

    const parsed = calendarEventFormSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Partial<Record<keyof Draft, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "title") next.title = t("errorTitleRequired");
        if (key === "startDate") next.startDate = t("errorStartDateRequired");
        if (key === "endDate") next.endDate = t("errorEndBeforeStart");
        if (key === "endTime") next.endTime = t("errorEndTimeInvalid");
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    setPending(true);

    try {
      const response = await fetch(editingId ? `/api/admin/termine/${editingId}` : "/api/admin/termine", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        setError(t("errorGeneric"));
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

  async function handleDelete(event: ManagedCalendarEvent) {
    // A calendar entry is a date the public homepage renders — deleting one
    // silently on a stray click would change what the site says with no
    // way to tell it happened.
    if (!confirm(t("confirmDelete", { title: event.title }))) return;

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/termine/${event.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError(t("errorGeneric"));
        return;
      }
      if (editingId === event.id) resetForm();
      router.refresh();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setPending(false);
    }
  }

  const dateFormatter = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  function formatRowDate(event: ManagedCalendarEvent): string {
    const start = dateFormatter.format(new Date(`${event.startDate}T00:00:00`));
    if (!event.endDate || event.endDate === event.startDate) return start;
    return `${start}–${dateFormatter.format(new Date(`${event.endDate}T00:00:00`))}`;
  }

  return (
    <div className="flex flex-col gap-10">
      <AdminTable
        columns={[t("columns.date"), t("columns.title"), t("columns.category"), t("columns.action")]}
        empty={t("empty")}
        rows={events.map((event) => ({
          key: event.id,
          cells: [
            formatRowDate(event),
            event.title,
            <CategoryBadge key="category" category={event.category} />,
            <span key="actions" className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => startEditing(event)} disabled={pending}>
                {t("edit")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(event)} disabled={pending}>
                {t("delete")}
              </Button>
            </span>,
          ],
        }))}
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 border-t border-ink/10 pt-8">
        <h2 className="text-heading-3 font-display">{editingId ? t("editHeading") : t("createHeading")}</h2>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-body-s font-medium text-ink">{t("categoryLabel")}</legend>
          <div className="flex flex-wrap gap-2">
            {CALENDAR_CATEGORIES.map((category) => (
              <label key={category} className="cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={draft.category === category}
                  onChange={() => setDraft({ ...draft, category })}
                  className="peer sr-only"
                />
                <CategoryBadge
                  category={category}
                  className="ring-offset-1 ring-offset-paper transition-shadow duration-[var(--duration-fast)] ease-signature peer-checked:ring-2 peer-checked:ring-ink/40 peer-focus-visible:ring-2 peer-focus-visible:ring-ink/40"
                />
                <span className="sr-only"> ({tCategories(category)})</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            label={t("titleLabel")}
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            error={fieldErrors.title}
          />
          <Field
            label={t("titleEnLabel")}
            hint={t("englishFallbackHint")}
            value={draft.titleEn}
            onChange={(event) => setDraft({ ...draft, titleEn: event.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            label={t("startDateLabel")}
            type="date"
            value={draft.startDate}
            onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
            error={fieldErrors.startDate}
          />
          <Field
            label={t("endDateLabel")}
            hint={t("endDateHint")}
            type="date"
            value={draft.endDate}
            onChange={(event) => setDraft({ ...draft, endDate: event.target.value })}
            error={fieldErrors.endDate}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            label={t("startTimeLabel")}
            type="time"
            value={draft.startTime}
            onChange={(event) => setDraft({ ...draft, startTime: event.target.value })}
          />
          <Field
            label={t("endTimeLabel")}
            type="time"
            value={draft.endTime}
            onChange={(event) => setDraft({ ...draft, endTime: event.target.value })}
            error={fieldErrors.endTime}
          />
        </div>

        <Field
          label={t("locationLabel")}
          value={draft.location}
          onChange={(event) => setDraft({ ...draft, location: event.target.value })}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            as="textarea"
            label={t("descriptionLabel")}
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
          <Field
            as="textarea"
            label={t("descriptionEnLabel")}
            hint={t("englishFallbackHint")}
            value={draft.descriptionEn}
            onChange={(event) => setDraft({ ...draft, descriptionEn: event.target.value })}
          />
        </div>

        <label className="flex items-start gap-3 text-body-s">
          <input
            type="checkbox"
            checked={draft.tentative}
            onChange={(event) => setDraft({ ...draft, tentative: event.target.checked })}
            className="mt-0.5 size-4 shrink-0 rounded border-ink/20 focus-visible:outline-2 focus-visible:outline-offset-2"
          />
          <span>{t("tentativeLabel")}</span>
        </label>

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
