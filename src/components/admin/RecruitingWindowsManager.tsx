"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { AdminTable } from "@/components/admin/AdminTable";
import { recruitingWindowFormSchema } from "@/lib/recruitingWindowFormSchema";

export type ManagedWindow = {
  id: string;
  semester: string;
  start: string;
  end: string;
  startWallClock: string;
  endWallClock: string;
};

type Draft = { semester: string; start: string; end: string };

const EMPTY_DRAFT: Draft = { semester: "", start: "", end: "" };

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Draft, string>>>({});

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
    });
    setFieldErrors({});
    setError(null);
  }

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
    // round trip — never instead of one.
    const parsed = recruitingWindowFormSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Partial<Record<keyof Draft, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "semester") next.semester = t("errorSemesterFormat");
        if (key === "end") next.end = t("errorEndBeforeStart");
        if (key === "start") next.start = t("errorDateRequired");
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

  const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="flex flex-col gap-10">
      <AdminTable
        columns={[t("columns.semester"), t("columns.start"), t("columns.end"), t("columns.action")]}
        empty={t("empty")}
        rows={windows.map((window) => ({
          key: window.id,
          cells: [
            window.semester,
            dateFormatter.format(new Date(window.start)),
            dateFormatter.format(new Date(window.end)),
            <span key="actions" className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => startEditing(window)} disabled={pending}>
                {t("edit")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(window)} disabled={pending}>
                {t("delete")}
              </Button>
            </span>,
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
            type="datetime-local"
            value={draft.start}
            onChange={(event) => setDraft({ ...draft, start: event.target.value })}
            error={fieldErrors.start}
          />
          <Field
            label={t("endLabel")}
            type="datetime-local"
            value={draft.end}
            onChange={(event) => setDraft({ ...draft, end: event.target.value })}
            error={fieldErrors.end}
          />
        </div>

        <p className="text-body-s opacity-60">{t("timezoneNote")}</p>

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
