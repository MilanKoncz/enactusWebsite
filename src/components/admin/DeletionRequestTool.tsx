"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";
import { Card } from "@/components/ui/Card";

type Matches = {
  applications: Record<string, unknown>[];
  contactMessages: Record<string, unknown>[];
  reminderSignups: Record<string, unknown>[];
  ideathonSignups: Record<string, unknown>[];
};

type Deleted = {
  applications: number;
  contactMessages: number;
  reminderSignups: number;
  ideathonSignups: number;
};

function total(matches: Matches): number {
  return (
    matches.applications.length +
    matches.contactMessages.length +
    matches.reminderSignups.length +
    matches.ideathonSignups.length
  );
}

// A client component throughout: the search result has to survive on screen
// while the board reads it and then types the address a second time to
// confirm, which is a multi-step interaction rather than a page render.
export function DeletionRequestTool() {
  const t = useTranslations("Admin.deletionRequests");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [matches, setMatches] = useState<Matches | null>(null);
  const [searchedEmail, setSearchedEmail] = useState("");
  const [deleted, setDeleted] = useState<Deleted | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setDeleted(null);
    setMatches(null);
    setConfirmEmail("");

    try {
      const response = await fetch("/api/admin/loeschanfragen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        setError(t("errorSearch"));
        return;
      }
      const body = (await response.json()) as { matches: Matches };
      setMatches(body.matches);
      setSearchedEmail(email);
    } catch {
      setError(t("errorSearch"));
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/loeschanfragen", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: searchedEmail, confirmEmail }),
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const code =
          body && typeof body === "object" && "error" in body ? (body as { error?: unknown }).error : null;
        setError(code === "confirmation_mismatch" ? t("errorMismatch") : t("errorDelete"));
        return;
      }
      const body = (await response.json()) as { deleted: Deleted };
      setDeleted(body.deleted);
      setMatches(null);
      setConfirmEmail("");
      setEmail("");
    } catch {
      setError(t("errorDelete"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSearch} noValidate className="flex flex-col gap-4">
        <Field
          label={t("emailLabel")}
          type="email"
          hint={t("emailHint")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Button type="submit" loading={pending} className="self-start">
          {t("search")}
        </Button>
      </form>

      {error && <FormStatusMessage variant="error">{error}</FormStatusMessage>}

      {deleted && (
        <FormStatusMessage variant="success">
          {t("deleted", {
            applications: deleted.applications,
            contactMessages: deleted.contactMessages,
            reminderSignups: deleted.reminderSignups,
            ideathonSignups: deleted.ideathonSignups,
          })}
        </FormStatusMessage>
      )}

      {matches && (
        <section className="flex flex-col gap-4 border-t border-ink/10 pt-8">
          <h2 className="text-heading-3 font-display font-normal!">{t("resultsHeading", { email: searchedEmail })}</h2>

          {total(matches) === 0 ? (
            <p className="text-body-m opacity-60">{t("noMatches")}</p>
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ["applications", matches.applications.length],
                    ["contactMessages", matches.contactMessages.length],
                    ["reminderSignups", matches.reminderSignups.length],
                    ["ideathonSignups", matches.ideathonSignups.length],
                  ] as const
                ).map(([key, count]) => (
                  <li key={key}>
                    <Card>
                      <p className="font-mono text-display-3 tabular-nums">{count}</p>
                      <p className="mt-1 text-body-s opacity-60">{t(`tables.${key}`)}</p>
                    </Card>
                  </li>
                ))}
              </ul>

              {/* The full records, because an Art. 15 access request is
                  precisely a request for all of it — a summary would be an
                  incomplete answer. */}
              <details className="rounded-md border border-ink/10 p-4">
                <summary className="cursor-pointer text-body-s font-medium">{t("showRaw")}</summary>
                <pre className="mt-3 overflow-x-auto font-mono text-mono-s opacity-80">
                  {JSON.stringify(matches, null, 2)}
                </pre>
              </details>

              <form onSubmit={handleDelete} noValidate className="flex flex-col gap-4 pt-4">
                <p className="text-body-s text-oxblood">{t("deleteWarning")}</p>
                <Field
                  label={t("confirmLabel")}
                  type="email"
                  hint={t("confirmHint")}
                  value={confirmEmail}
                  onChange={(event) => setConfirmEmail(event.target.value)}
                  required
                />
                <Button type="submit" loading={pending} className="self-start">
                  {t("delete")}
                </Button>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  );
}
