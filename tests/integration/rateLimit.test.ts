// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const peekRateLimit = vi.fn();
const consumeRateLimit = vi.fn();

vi.mock("@/lib/db", () => ({
  peekRateLimit: (...args: unknown[]) => peekRateLimit(...args),
  consumeRateLimit: (...args: unknown[]) => consumeRateLimit(...args),
}));

describe("checkRateLimit", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("allows a request within the shared limit", async () => {
    peekRateLimit.mockResolvedValue(0);
    consumeRateLimit.mockResolvedValue(1);
    const { checkRateLimit } = await import("@/lib/rateLimit");

    const result = await checkRateLimit("bewerbung", "203.0.113.1");

    expect(result).toEqual({ allowed: true, remaining: 4 });
  });

  it("rejects a flood once the shared limit is exceeded, without writing a row for the rejected request", async () => {
    peekRateLimit.mockResolvedValue(5);
    const { checkRateLimit } = await import("@/lib/rateLimit");

    const result = await checkRateLimit("bewerbung", "203.0.113.1");

    expect(result).toEqual({ allowed: false, remaining: 0 });
    expect(consumeRateLimit).not.toHaveBeenCalled();
  });

  it("only increments the counter for a request that's still under the limit", async () => {
    peekRateLimit.mockResolvedValue(3);
    consumeRateLimit.mockResolvedValue(4);
    const { checkRateLimit } = await import("@/lib/rateLimit");

    const result = await checkRateLimit("bewerbung", "203.0.113.1");

    expect(consumeRateLimit).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ allowed: true, remaining: 1 });
  });

  it("never passes the raw IP address to the database layer, only its hash", async () => {
    peekRateLimit.mockResolvedValue(0);
    consumeRateLimit.mockResolvedValue(1);
    const { checkRateLimit } = await import("@/lib/rateLimit");

    await checkRateLimit("bewerbung", "203.0.113.1");

    const [bucket] = peekRateLimit.mock.calls[0] as [string, Date];
    expect(bucket).not.toContain("203.0.113.1");
    expect(bucket).toMatch(/^bewerbung:[0-9a-f]{64}$/);
  });

  it("hashes the same IP identically across calls, so repeat hits land in the same bucket", async () => {
    peekRateLimit.mockResolvedValue(0);
    consumeRateLimit.mockResolvedValue(1);
    const { checkRateLimit } = await import("@/lib/rateLimit");

    await checkRateLimit("kontakt", "203.0.113.1");
    await checkRateLimit("kontakt", "203.0.113.1");

    const [firstBucket] = peekRateLimit.mock.calls[0] as [string, Date];
    const [secondBucket] = peekRateLimit.mock.calls[1] as [string, Date];
    expect(firstBucket).toBe(secondBucket);
  });

  it("keeps buckets for different routes separate, even for the same IP", async () => {
    peekRateLimit.mockResolvedValue(0);
    consumeRateLimit.mockResolvedValue(1);
    const { checkRateLimit } = await import("@/lib/rateLimit");

    await checkRateLimit("bewerbung", "203.0.113.1");
    await checkRateLimit("kontakt", "203.0.113.1");

    const [bewerbungBucket] = peekRateLimit.mock.calls[0] as [string, Date];
    const [kontaktBucket] = peekRateLimit.mock.calls[1] as [string, Date];
    expect(bewerbungBucket).not.toBe(kontaktBucket);
  });
});
