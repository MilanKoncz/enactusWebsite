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
import { departmentFormSchema } from "@/lib/departmentFormSchema";

export type ManagedDepartment = {
  id: string;
  labelDe: string;
  labelEn: string;
  sortOrder: number;
  active: boolean;
};

type Draft = { labelDe: string; labelEn: string; sortOrder: string; active: boolean };

const EMPTY_DRAFT: Draft = { labelDe: "", labelEn: "", sortOrder: "0", active: true };

function toDraft(department: ManagedDepartment): Draft {
  return {
    labelDe: department.labelDe,
    labelEn: department.labelEn,
    sortOrder: String(department.sortOrder),
    active: department.active,
  };
}

/**
 * List, create, edit, and (de)activate for /admin/ressorts — same
 * one-client-component shape as ProjectAreasManager.tsx / plain useState
 * draft + schema.safeParse, matching the rest of the admin area.
 *
 * Deactivating, not deleting, is the everyday action here: a department a
 * board member switches off still stays in every application that already
 * chose it (applications.departments stores plain strings, no foreign key)
 * — delete exists for a genuine mistake, not the normal end-of-semester
 * cleanup.
 */
export function DepartmentsManager({ departments }: { departments: ManagedDepartment[] }) {
  const t = useTranslations("Admin.departments");
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

  function startEditing(department: ManagedDepartment) {
    setEditingId(department.id);
    setDraft(toDraft(department));
    setFieldErrors({});
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = departmentFormSchema.safeParse(draft);
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
        editingId ? `/api/admin/ressorts/${editingId}` : "/api/admin/ressorts",
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

  async function toggleActive(department: ManagedDepartment) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/ressorts/${department.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          labelDe: department.labelDe,
          labelEn: department.labelEn,
          sortOrder: department.sortOrder,
          active: !department.active,
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

  async function handleDelete(department: ManagedDepartment) {
    // Deactivating is the everyday action (see the component's own
    // comment) — delete is for a genuine mistake, so it gets the same
    // are-you-sure guard every other destructive admin action has.
    if (!confirm(t("confirmDelete", { label: department.labelDe }))) return;

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/ressorts/${department.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError(t("errorGeneric"));
        return;
      }
      if (editingId === department.id) resetForm();
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
        rows={departments.map((department) => ({
          key: department.id,
          cells: [
            <span key="label" className="flex flex-col">
              <span>{department.labelDe}</span>
              {department.labelEn !== department.labelDe && (
                <span className="opacity-60">{department.labelEn}</span>
              )}
            </span>,
            <span key="sortOrder" className="font-mono text-mono-s tabular-nums">
              {department.sortOrder}
            </span>,
            <StatusIndicator
              key="active"
              level={department.active ? "ok" : "neutral"}
              label={department.active ? t("active") : t("inactive")}
            />,
            <span key="actions" className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => toggleActive(department)} disabled={pending}>
                {department.active ? t("deactivate") : t("activate")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => startEditing(department)} disabled={pending}>
                {t("edit")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(department)} disabled={pending}>
                {t("delete")}
              </Button>
            </span>,
          ],
        }))}
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 border-t border-ink/10 pt-8">
        <h2 className="text-heading-3 font-display font-normal!">
          {editingId ? t("editHeading") : t("createHeading")}
        </h2>

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
