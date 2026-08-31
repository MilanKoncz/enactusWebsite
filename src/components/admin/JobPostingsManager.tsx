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
import { jobPostingCreateSchema, jobPostingFormSchema } from "@/lib/jobPostingFormSchema";
import { isExpiredJobPosting } from "@/lib/jobPostingStatus";
import { parseDateOnly } from "@/lib/calendarFormat";
import { EMPLOYMENT_TYPES, REMOTE_OPTIONS } from "@/content/jobs";
import type { EmploymentType, RemoteOption } from "@/content/jobs";
import { partners } from "@/content/partners";

export type ManagedJobPosting = {
  id: string;
  company: string;
  title: string;
  employmentType: EmploymentType;
  location: string | null;
  remote: RemoteOption;
  description: string | null;
  applyUrl: string;
  expiresAt: string;
  partnerSlug: string | null;
};

type Draft = {
  company: string;
  title: string;
  employmentType: EmploymentType;
  location: string;
  remote: RemoteOption;
  description: string;
  applyUrl: string;
  expiresAt: string;
  partnerSlug: string;
};

const EMPTY_DRAFT: Draft = {
  company: "",
  title: "",
  employmentType: EMPLOYMENT_TYPES[0],
  location: "",
  remote: REMOTE_OPTIONS[0],
  description: "",
  applyUrl: "",
  expiresAt: "",
  partnerSlug: "",
};

function toDraft(job: ManagedJobPosting): Draft {
  return {
    company: job.company,
    title: job.title,
    employmentType: job.employmentType,
    location: job.location ?? "",
    remote: job.remote,
    description: job.description ?? "",
    applyUrl: job.applyUrl,
    expiresAt: job.expiresAt,
    partnerSlug: job.partnerSlug ?? "",
  };
}

/**
 * List, create, edit, and delete for /admin/jobs — same one-client-
 * component shape as CalendarEventsManager.tsx (plain useState draft +
 * schema.safeParse, not react-hook-form, matching the rest of the admin
 * area).
 *
 * Employment type and remote both use a radio-chip group rather than a
 * native `<select>`, same reasoning CalendarEventsManager.tsx gives for its
 * category picker: few enough fixed options that showing all of them at
 * once is both more informative and one click faster than opening a
 * dropdown. Partner uses a real `<select>` instead — the option list scales
 * with content/partners.ts, which is long enough that chips would crowd the
 * form.
 */
export function JobPostingsManager({ jobs, now }: { jobs: ManagedJobPosting[]; now: number }) {
  const t = useTranslations("Admin.jobPostings");
  const tTypes = useTranslations("JobEmploymentTypes");
  const tRemote = useTranslations("JobRemoteOptions");
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

  function startEditing(job: ManagedJobPosting) {
    setEditingId(job.id);
    setDraft(toDraft(job));
    setFieldErrors({});
    setError(null);
  }

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError(null);

    const schema = editingId ? jobPostingFormSchema : jobPostingCreateSchema;
    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      const next: Partial<Record<keyof Draft, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "company") next.company = t("errorCompanyRequired");
        if (key === "title") next.title = t("errorTitleRequired");
        if (key === "applyUrl") next.applyUrl = t("errorApplyUrlInvalid");
        if (key === "expiresAt" && draft.expiresAt === "") next.expiresAt = t("errorExpiresAtRequired");
        else if (key === "expiresAt") next.expiresAt = t("errorExpiresAtPast");
      }
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    setPending(true);

    try {
      const response = await fetch(editingId ? `/api/admin/jobs/${editingId}` : "/api/admin/jobs", {
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

  async function handleDelete(job: ManagedJobPosting) {
    // A job posting is public content — deleting one silently on a stray
    // click would change what the site says with no way to tell it happened.
    if (!confirm(t("confirmDelete", { title: job.title, company: job.company }))) return;

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/jobs/${job.id}`, { method: "DELETE" });
      if (!response.ok) {
        setError(t("errorGeneric"));
        return;
      }
      if (editingId === job.id) resetForm();
      router.refresh();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setPending(false);
    }
  }

  // parseDateOnly + a UTC-pinned formatter, same as CalendarEventsManager's
  // own fix and every calendar view (calendarFormat.ts) — expiresAt is a
  // plain "YYYY-MM-DD" with no time-of-day.
  const dateFormatter = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="flex flex-col gap-10">
      <AdminTable
        columns={[
          t("columns.company"),
          t("columns.title"),
          t("columns.type"),
          t("columns.expiresAt"),
          t("columns.status"),
          t("columns.action"),
        ]}
        empty={t("empty")}
        rows={jobs.map((job) => {
          const expired = isExpiredJobPosting(job.expiresAt, now);
          return {
            key: job.id,
            cells: [
              job.company,
              job.title,
              tTypes(job.employmentType),
              dateFormatter.format(parseDateOnly(job.expiresAt)),
              <StatusIndicator
                key="status"
                level={expired ? "neutral" : "ok"}
                label={expired ? t("expiredBadge") : t("activeBadge")}
              />,
              <span key="actions" className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => startEditing(job)} disabled={pending}>
                  {t("edit")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(job)} disabled={pending}>
                  {t("delete")}
                </Button>
              </span>,
            ],
          };
        })}
      />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 border-t border-ink/10 pt-8">
        <h2 className="text-heading-3 font-display font-normal!">{editingId ? t("editHeading") : t("createHeading")}</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            label={t("companyLabel")}
            value={draft.company}
            onChange={(event) => setDraft({ ...draft, company: event.target.value })}
            error={fieldErrors.company}
          />
          <Field
            label={t("titleLabel")}
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            error={fieldErrors.title}
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-body-s font-medium text-ink">{t("employmentTypeLabel")}</legend>
          <div className="flex flex-wrap gap-2">
            {EMPLOYMENT_TYPES.map((type) => (
              <label key={type} className="cursor-pointer">
                <input
                  type="radio"
                  name="employmentType"
                  value={type}
                  checked={draft.employmentType === type}
                  onChange={() => setDraft({ ...draft, employmentType: type })}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center rounded-sm border border-ink/20 px-2.5 py-1 font-mono text-mono-xs uppercase transition-shadow duration-[var(--duration-fast)] ease-signature peer-checked:border-ink peer-checked:ring-2 peer-checked:ring-ink/30 peer-focus-visible:ring-2 peer-focus-visible:ring-ink/30">
                  {tTypes(type)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-body-s font-medium text-ink">{t("remoteLabel")}</legend>
          <div className="flex flex-wrap gap-2">
            {REMOTE_OPTIONS.map((option) => (
              <label key={option} className="cursor-pointer">
                <input
                  type="radio"
                  name="remote"
                  value={option}
                  checked={draft.remote === option}
                  onChange={() => setDraft({ ...draft, remote: option })}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center rounded-sm border border-ink/20 px-2.5 py-1 font-mono text-mono-xs uppercase transition-shadow duration-[var(--duration-fast)] ease-signature peer-checked:border-ink peer-checked:ring-2 peer-checked:ring-ink/30 peer-focus-visible:ring-2 peer-focus-visible:ring-ink/30">
                  {tRemote(option)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            label={t("locationLabel")}
            value={draft.location}
            onChange={(event) => setDraft({ ...draft, location: event.target.value })}
          />
          <Field
            label={t("partnerLabel")}
            as="select"
            value={draft.partnerSlug}
            onChange={(event) => setDraft({ ...draft, partnerSlug: event.target.value })}
          >
            <option value="">{t("partnerNone")}</option>
            {partners.map((partner) => (
              <option key={partner.slug} value={partner.slug}>
                {partner.name}
              </option>
            ))}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            label={t("applyUrlLabel")}
            hint={t("applyUrlHint")}
            type="url"
            value={draft.applyUrl}
            onChange={(event) => setDraft({ ...draft, applyUrl: event.target.value })}
            error={fieldErrors.applyUrl}
          />
          <Field
            label={t("expiresAtLabel")}
            type="date"
            value={draft.expiresAt}
            onChange={(event) => setDraft({ ...draft, expiresAt: event.target.value })}
            error={fieldErrors.expiresAt}
          />
        </div>

        <Field
          as="textarea"
          label={t("descriptionLabel")}
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />

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
