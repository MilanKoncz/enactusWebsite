// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const consumeRateLimit = vi.fn();

vi.mock("@/lib/db", () => ({
  consumeRateLimit: (...args: unknown[]) => consumeRateLimit(...args),
}));

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("allows a request within the shared limit", async () => {
    consumeRateLimit.mockResolvedValue(1);
    const { checkRateLimit } = await import("@/lib/rateLimit");

    const result = await checkRateLimit("bewerbung", "203.0.113.1");

    expect(result).toEqual({ allowed: true, remaining: 4 });
  });

  it("rejects a flood once the shared limit is exceeded", async () => {
    consumeRateLimit.mockResolvedValue(6);
    const { checkRateLimit } = await import("@/lib/rateLimit");

    const result = await checkRateLimit("bewerbung", "203.0.113.1");

    expect(result).toEqual({ allowed: false, remaining: 0 });
  });

  it("never passes the raw IP address to the database layer, only its hash", async () => {
    consumeRateLimit.mockResolvedValue(1);
    const { checkRateLimit } = await import("@/lib/rateLimit");

    await checkRateLimit("bewerbung", "203.0.113.1");

    const [bucket] = consumeRateLimit.mock.calls[0] as [string, Date];
    expect(bucket).not.toContain("203.0.113.1");
    expect(bucket).toMatch(/^bewerbung:[0-9a-f]{64}$/);
  });

  it("hashes the same IP identically across calls, so repeat hits land in the same bucket", async () => {
    consumeRateLimit.mockResolvedValue(1);
    const { checkRateLimit } = await import("@/lib/rateLimit");

    await checkRateLimit("kontakt", "203.0.113.1");
    await checkRateLimit("kontakt", "203.0.113.1");

    const [firstBucket] = consumeRateLimit.mock.calls[0] as [string, Date];
    const [secondBucket] = consumeRateLimit.mock.calls[1] as [string, Date];
    expect(firstBucket).toBe(secondBucket);
  });

  it("keeps buckets for different routes separate, even for the same IP", async () => {
    consumeRateLimit.mockResolvedValue(1);
    const { checkRateLimit } = await import("@/lib/rateLimit");

    await checkRateLimit("bewerbung", "203.0.113.1");
    await checkRateLimit("kontakt", "203.0.113.1");

    const [bewerbungBucket] = consumeRateLimit.mock.calls[0] as [string, Date];
    const [kontaktBucket] = consumeRateLimit.mock.calls[1] as [string, Date];
    expect(bewerbungBucket).not.toBe(kontaktBucket);
  });
});
