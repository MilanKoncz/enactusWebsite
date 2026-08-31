"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

type State = "idle" | "pending" | "error";

/**
 * The shared delete action for the three admin list pages that had no
 * mutation capability at all before this — /admin/bewerbungen,
 * /admin/erinnerungen, /admin/ideathon-anmeldungen. Unlike
 * /admin/wunschbereiche and its siblings, these pages are plain server
 * components with no client-side "manager" already holding shared form
 * state, so this is self-contained per row instead: same shape as
 * ResendMailButton.tsx (confirm, call the endpoint, `router.refresh()` on
 * success), which is also a mutation embedded directly in an
 * otherwise-server-rendered list row.
 *
 * `confirmLabel` is fully composed by the caller, not built in here: which
 * fields identify a row differs per resource (name and email for an
 * application or Ideathon signup, just an email for a reminder signup), and
 * baking that shape into this component would make it resource-specific
 * again — the opposite of "one reusable component, not three copies".
 *
 * `router.refresh()` re-runs the page's server query rather than
 * optimistically removing the row from local state: the row leaves the
 * list because the database says it's gone, not because this component
 * assumed the request would succeed.
 */
export function AdminDeleteButton({
  endpoint,
  id,
  confirmLabel,
  label,
}: {
  endpoint: string;
  id: string;
  confirmLabel: string;
  /** Overrides the button's own visible text (defaults to the generic
      "delete" string) — for a reused instance whose action isn't "delete
      the row", like clearing just a CV while the application stays. */
  label?: string;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [state, setState] = useState<State>("idle");

  async function handleClick() {
    if (!confirm(confirmLabel)) return;
    setState("pending");
    try {
      const response = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setState("error");
        return;
      }
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <span className="flex flex-col items-start gap-1">
      <Button variant="ghost" size="sm" loading={state === "pending"} onClick={handleClick}>
        {label ?? t("delete")}
      </Button>
      {state === "error" && (
        <span role="alert" className="text-body-s text-oxblood">
          {t("deleteFailed")}
        </span>
      )}
    </span>
  );
}
