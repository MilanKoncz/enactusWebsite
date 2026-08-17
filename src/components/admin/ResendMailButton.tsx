"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { FailedMailSource } from "@/lib/db";

type State = "idle" | "pending" | "sent" | "error";

// Reports the outcome in place rather than optimistically removing the row:
// a resend that fails again is the case the board most needs to see, and a
// row that vanished on click would hide exactly that. On success
// router.refresh() re-runs the page's server query, so the row leaves the
// list because the database says it's no longer failed — not because this
// component assumed so.
export function ResendMailButton({ source, id }: { source: FailedMailSource; id: string }) {
  const t = useTranslations("Admin.failedMails");
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setState("pending");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/mails/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source, id }),
      });
      const body: unknown = await response.json().catch(() => null);

      if (response.ok) {
        setState("sent");
        router.refresh();
        return;
      }

      const detail =
        body && typeof body === "object" && "message" in body && typeof body.message === "string"
          ? body.message
          : null;
      setMessage(detail);
      setState("error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <span role="status" className="text-body-s text-moss">
        {t("resent")}
      </span>
    );
  }

  return (
    <span className="flex flex-col items-start gap-1">
      <Button variant="secondary" size="sm" loading={state === "pending"} onClick={handleClick}>
        {t("resend")}
      </Button>
      {state === "error" && (
        <span role="alert" className="text-body-s text-oxblood">
          {message ? t("resendFailedWithReason", { reason: message }) : t("resendFailed")}
        </span>
      )}
    </span>
  );
}
