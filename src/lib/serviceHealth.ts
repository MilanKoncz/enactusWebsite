/**
 * Reachability checks for /admin/system. Both answer one question — "is
 * this dependency answering right now?" — and neither throws: a health
 * panel that crashes because a dependency is down is the opposite of
 * useful.
 *
 * Database health isn't here: countRowsPerTable() already proves Neon is
 * answering, so a separate ping would be a second round trip to learn
 * something the page has just been told.
 */
export type ServiceStatus = { reachable: boolean; detail: string | null };

/**
 * Checks Resend by listing domains, not by sending anything: the board
 * opening this page must never cost a real email. A 200 means the API is up
 * *and* the key is accepted, which is the pair that actually matters — an
 * expired key looks exactly like an outage from the send path's point of
 * view, and this distinguishes them.
 */
export async function checkResend(): Promise<ServiceStatus> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { reachable: false, detail: "RESEND_API_KEY is not set" };

  try {
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
      // Without a bound, an unreachable provider would hang this page for
      // as long as the platform's function timeout allows.
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (response.ok) return { reachable: true, detail: null };
    return { reachable: false, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { reachable: false, detail: error instanceof Error ? error.message : String(error) };
  }
}
