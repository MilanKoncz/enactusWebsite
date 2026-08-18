"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function AdminLoginForm() {
  const t = useTranslations("Admin.login");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.status === 429) {
        setError(t("rateLimited"));
        return;
      }
      if (!response.ok) {
        setError(t("error"));
        return;
      }

      // A server component re-render (not a client-side navigation) is what
      // actually re-reads the now-set cookie, since the guard lives in
      // page.tsx's server-side render, not in any client state here.
      router.refresh();
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-6">
      <Field
        label={t("passwordLabel")}
        type={passwordVisible ? "text" : "password"}
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        error={error ?? undefined}
        endAdornment={
          <button
            type="button"
            aria-pressed={passwordVisible}
            aria-label={passwordVisible ? t("hidePassword") : t("showPassword")}
            onClick={() => setPasswordVisible((visible) => !visible)}
            className="rounded-md p-1 text-ink/60 transition-colors duration-[var(--duration-fast)] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {passwordVisible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </button>
        }
      />
      <Button type="submit" loading={submitting}>
        {t("submit")}
      </Button>
    </form>
  );
}
