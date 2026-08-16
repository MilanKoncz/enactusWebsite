import { randomBytes } from "node:crypto";

/**
 * Confirmation and unsubscribe tokens for the reminder list's double
 * opt-in. base64url, not hex: it's shorter for the same entropy and safe
 * to drop straight into a query string with no extra encoding step.
 * 32 random bytes (256 bits) is comfortably beyond brute-force range for a
 * token that only needs to resist guessing, not double as a password.
 */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}
