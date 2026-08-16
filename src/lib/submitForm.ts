/**
 * The one place all three form components (ApplicationForm,
 * ReminderSignupForm, ContactForm) post to an API route from. A shared
 * two-line helper rather than three copies of the same try/catch — the
 * point isn't code size, it's that a network failure and a non-2xx
 * response are told apart the same way everywhere, so every form's error
 * state means the same thing.
 */

export type SubmitOutcome = { ok: true } | { ok: false };

export async function postJson(url: string, body: unknown): Promise<SubmitOutcome> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return response.ok ? { ok: true } : { ok: false };
  } catch {
    return { ok: false };
  }
}
