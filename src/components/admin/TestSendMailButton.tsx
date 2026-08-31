"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { StatusIndicator } from "@/components/admin/StatusIndicator";

type State = "idle" | "pending" | "done" | "error";
type TestSendResult = { key: string; label: string; ok: boolean; error?: string };

/**
 * Lets a board member see all ten real mail templates render for real, in
 * their own inbox, after any copy change — without waiting for a genuine
 * submission or resend to trigger one
 * (/api/admin/mails/testversand/route.ts has the actual send logic and the
 * full reasoning). This component only owns the address field and the
 * per-template result list; every send it triggers is redirected to that
 * address and subject-prefixed there, not here.
 */
export function TestSendMailButton() {
  const t = useTranslations("Admin.testSend");
  const [to, setTo] = useState("");
  const [state, setState] = useState<State>("idle");
  const [results, setResults] = useState<TestSendResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleClick() {
    setState("pending");
    setErrorMessage(null);
    setResults([]);
    try {
      const response = await fetch("/api/admin/mails/testversand", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const body: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(t("errorGeneric"));
        setState("error");
        return;
      }

      const parsedResults =
        body && typeof body === "object" && "results" in body && Array.isArray(body.results)
          ? (body.results as TestSendResult[])
          : [];
      setResults(parsedResults);
      setState("done");
    } catch {
      setErrorMessage(t("errorGeneric"));
      setState("error");
    }
  }

  return (
    <div className="flex flex-col gap-4 border-t border-ink/10 pt-8">
      <div>
        <h2 className="text-heading-3 font-display font-normal!">{t("heading")}</h2>
        <p className="mt-1 text-body-s opacity-60">{t("lead")}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field
          label={t("emailLabel")}
          type="email"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          containerClassName="max-w-sm"
        />
        <Button loading={state === "pending"} disabled={!to} onClick={handleClick}>
          {t("send")}
        </Button>
      </div>

      {state === "error" && errorMessage && (
        <p role="alert" className="text-body-s text-oxblood">
          {errorMessage}
        </p>
      )}

      {state === "done" && (
        <ul className="flex flex-col gap-2" aria-label={t("resultsLabel")}>
          {results.map((result) => (
            <li key={result.key} className="flex flex-col gap-1">
              <StatusIndicator
                level={result.ok ? "ok" : "error"}
                label={result.ok ? result.label : `${result.label} — ${t("resultFailed")}`}
              />
              {!result.ok && result.error && (
                <span className="pl-6 font-mono text-mono-s opacity-80">{result.error}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
