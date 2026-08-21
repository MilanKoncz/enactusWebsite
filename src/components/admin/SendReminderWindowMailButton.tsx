"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

type State = "idle" | "pending" | "sent" | "error";

/**
 * The board's manual override for the reminder-window mail
 * (lib/reminderWindowMail.ts) — a safety net for launch day if the daily
 * cron slips or the window opens at an inconvenient hour. Same
 * request/response shape as ResendMailButton, but confirms first: unlike a
 * single-record resend, this can mail the entire confirmed reminder list at
 * once. The confirmation dialog is UX, not the actual safety mechanism —
 * that's the database's once-per-(signup, window) unique constraint, which
 * makes a repeated click (or a click racing the cron) cheap: anyone already
 * mailed is simply skipped, reported back as part of the same counts.
 */
export function SendReminderWindowMailButton({ windowId, semester }: { windowId: string; semester: string }) {
  const t = useTranslations("Admin.recruitingWindows");
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  async function handleClick() {
    if (!confirm(t("confirmSendReminder", { semester }))) return;

    setState("pending");
    try {
      const response = await fetch("/api/admin/erinnerungen/fenster", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ windowId }),
      });
      const body: unknown = await response.json().catch(() => null);

      if (
        response.ok &&
        body &&
        typeof body === "object" &&
        "sent" in body &&
        typeof body.sent === "number" &&
        "failed" in body &&
        typeof body.failed === "number"
      ) {
        setResult({ sent: body.sent, failed: body.failed });
        setState("sent");
        return;
      }
      setState("error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent" && result) {
    return (
      <span role="status" className="text-body-s text-moss">
        {t("reminderSentResult", { sent: result.sent, failed: result.failed })}
      </span>
    );
  }

  return (
    <span className="flex flex-col items-start gap-1">
      <Button variant="ghost" size="sm" loading={state === "pending"} onClick={handleClick}>
        {t("sendReminder")}
      </Button>
      {state === "error" && (
        <span role="alert" className="text-body-s text-oxblood">
          {t("sendReminderFailed")}
        </span>
      )}
    </span>
  );
}
