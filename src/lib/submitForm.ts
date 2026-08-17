/**
 * The one place all three form components (ApplicationForm,
 * ReminderSignupForm, ContactForm) post to an API route from. A shared
 * two-line helper rather than three copies of the same try/catch — the
 * point isn't code size, it's that a network failure and a non-2xx
 * response are told apart the same way everywhere, so every form's error
 * state means the same thing.
 *
 * `error` carries the route's machine-readable error code (its JSON body's
 * `error` field, e.g. "window_closed") when the response has one — most
 * callers only ever check `.ok`, but a form that needs to distinguish one
 * specific failure from a generic one (the application window having
 * closed between page load and submit) can match on this instead of adding
 * its own parsing.
 */

export type SubmitOutcome = { ok: true } | { ok: false; error?: string };

export async function postJson(url: string, body: unknown): Promise<SubmitOutcome> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) return { ok: true };

    const parsed: unknown = await response.json().catch(() => null);
    const error =
      parsed && typeof parsed === "object" && "error" in parsed && typeof parsed.error === "string"
        ? parsed.error
        : undefined;
    return { ok: false, error };
  } catch {
    return { ok: false };
  }
}
