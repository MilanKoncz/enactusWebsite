"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { StatusIndicator } from "@/components/admin/StatusIndicator";
import { AdminTable } from "@/components/admin/AdminTable";
import { projectAreaFormSchema } from "@/lib/projectAreaFormSchema";

export type ManagedProjectArea = {
  id: string;
  labelDe: string;
  labelEn: string;
  sortOrder: number;
  active: boolean;
};

type Draft = { labelDe: string; labelEn: string; sortOrder: string; active: boolean };

const EMPTY_DRAFT: Draft = { labelDe: "", labelEn: "", sortOrder: "0", active: true };

function toDraft(area: ManagedProjectArea): Draft {
  return {
    labelDe: area.labelDe,
    labelEn: area.labelEn,
    sortOrder: String(area.sortOrder),
    active: area.active,
  };
}

/**
 * List, create, edit, and (de)activate for /admin/wunschbereiche — same
 * one-client-component shape as CalendarEventsManager.tsx / plain useState
 * draft + schema.safeParse, matching the rest of the admin area.
 *
 * Deactivating, not deleting, is the everyday action here: an area a
 * board member switches off still stays in every application that already
 * chose it (applications.desired_areas stores plain strings, no foreign
 * key) — delete exists for a genuine mistake, not the normal
 * end-of-semester cleanup.
 */
export function ProjectAreasManager({ areas }: { areas: ManagedProjectArea[] }) {
  const t = useTranslations("Admin.projectAreas");
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

  function startEditing(area: ManagedProjectArea) {
    setEditingId(area.id);
    setDraft(toDraft(area));
    setFieldErrors({});
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = projectAreaFormSchema.safeParse(draft);
    if (!parsed.success) {
      const next: Partial<Record<keyof Draft, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "labelDe") next.labelDe = t("errorLabelDeRequired");
        if (key === "labelEn") next.labelEn = t("errorLabelEnRequired");
        if (key === "sortOrder") next.sortOrder = t("errorSortOrderInvalid");
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    setPending(true);

    try {
      const response = await fetch(
        editingId ? `/api/admin/wunschbereiche/${editingId}` : "/api/admin/wunschbereiche",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );

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

  async function toggleActive(area: ManagedProjectArea) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/wunschbereiche/${area.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          labelDe: area.labelDe,
          labelEn: area.labelEn,
          sortOrder: area.sortOrder,
          active: !area.active,
        }),
      });
      if (!response.ok) {
        setError(t("errorGeneric"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(area: ManagedProjectArea) {
    // Deactivating is the everyday action (see the component's own
    // comment) — delete is for a genuine mistake, so it gets the same
    // are-you-sure guard every other destructive admin action has.
    if (!confirm(t("confirmDelete", { label: area.labelDe }))) return;

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/wunschbereiche/${area.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError(t("errorGeneric"));
        return;
      }
      if (editingId === area.id) resetForm();
      router.refresh();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <AdminTable
        columns={[t("columns.label"), t("columns.sortOrder"), t("columns.active"), t("columns.action")]}
        empty={t("empty")}
        rows={areas.map((area) => ({
          key: area.id,
          cells: [
            <span key="label" className="flex flex-col">
              <span>{area.labelDe}</span>
              {area.labelEn !== area.labelDe && <span className="opacity-60">{area.labelEn}</span>}
            </span>,
            <span key="sortOrder" className="font-mono text-mono-s tabular-nums">
              {area.sortOrder}
            </span>,
            <StatusIndicator
              key="active"
              level={area.active ? "ok" : "neutral"}
              label={area.active ? t("active") : t("inactive")}
            />,
            <span key="actions" className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => toggleActive(area)} disabled={pending}>
                {area.active ? t("deactivate") : t("activate")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => startEditing(area)} disabled={pending}>
                {t("edit")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(area)} disabled={pending}>
                {t("delete")}
              </Button>
            </span>,
          ],
        }))}
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 border-t border-ink/10 pt-8">
        <h2 className="text-heading-3 font-display font-normal!">{editingId ? t("editHeading") : t("createHeading")}</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            label={t("labelDeLabel")}
            value={draft.labelDe}
            onChange={(event) => setDraft({ ...draft, labelDe: event.target.value })}
            error={fieldErrors.labelDe}
          />
          <Field
            label={t("labelEnLabel")}
            value={draft.labelEn}
            onChange={(event) => setDraft({ ...draft, labelEn: event.target.value })}
            error={fieldErrors.labelEn}
          />
        </div>

        <Field
          label={t("sortOrderLabel")}
          hint={t("sortOrderHint")}
          type="number"
          value={draft.sortOrder}
          onChange={(event) => setDraft({ ...draft, sortOrder: event.target.value })}
          error={fieldErrors.sortOrder}
        />

        <label className="flex items-start gap-3 text-body-s">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
            className="mt-0.5 size-4 shrink-0 rounded border-ink/20 focus-visible:outline-2 focus-visible:outline-offset-2"
          />
          <span>{t("activeLabel")}</span>
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
