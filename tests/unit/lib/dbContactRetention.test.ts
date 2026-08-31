import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Pins down the anchor content/retention.ts's comment and the
 * Datenschutzerklärung's `retention.contactValue` ("... Monate nach Eingang
 * der Anfrage") both depend on: contact messages are deleted by the age of
 * their own created_at, not by some later, unrecorded "final processing"
 * event — the Datenschutzerklärung used to promise the latter (fixed
 * 2026-08-31) while the query always did the former, a real mismatch
 * between the legal text and what the code actually enforced. Every other
 * test touching this function mocks the whole @/lib/db module (see
 * tests/integration/cleanup.test.ts) and so can't see the column the SQL
 * itself references — this one mocks one level lower, at the Neon client,
 * specifically to catch a future accidental switch to a different column.
 */
const queryMock = vi.fn<(strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown[]>>(
  async () => [],
);

vi.mock("@neondatabase/serverless", () => ({
  neon: () => queryMock,
}));

describe("deleteExpiredContactMessages", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = "postgres://test-connection-string";
    queryMock.mockClear();
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    vi.resetModules();
  });

  it("deletes by created_at, not by any other timestamp column", async () => {
    vi.resetModules();
    const { deleteExpiredContactMessages } = await import("@/lib/db");

    await deleteExpiredContactMessages(new Date("2026-01-01T00:00:00Z"));

    expect(queryMock).toHaveBeenCalledTimes(1);
    const [strings] = queryMock.mock.calls[0];
    const sqlText = strings.join("?");
    expect(sqlText).toContain("created_at");
    expect(sqlText).not.toMatch(/processed_at|bearbeitet/);
  });

  it("passes the cutoff through as the comparison value, unmodified", async () => {
    vi.resetModules();
    const { deleteExpiredContactMessages } = await import("@/lib/db");
    const cutoff = new Date("2026-01-01T00:00:00Z");

    await deleteExpiredContactMessages(cutoff);

    const [, cutoffValue] = queryMock.mock.calls[0];
    expect(cutoffValue).toBe(cutoff.toISOString());
  });
});
