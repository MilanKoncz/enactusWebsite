import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { clientIp } from "@/lib/requestIp";

function request(headers: Record<string, string>) {
  return new NextRequest("http://localhost/api/example", { headers });
}

describe("clientIp", () => {
  it("reads the first entry of x-forwarded-for", () => {
    expect(clientIp(request({ "x-forwarded-for": "203.0.113.1, 10.0.0.1" }))).toBe("203.0.113.1");
  });

  it("trims whitespace around the first entry", () => {
    expect(clientIp(request({ "x-forwarded-for": " 203.0.113.1 , 10.0.0.1" }))).toBe("203.0.113.1");
  });

  it("falls back to a sentinel when x-forwarded-for is missing", () => {
    expect(clientIp(request({}))).toBe("unknown");
  });

  it("ignores x-real-ip — Vercel never sets it, so it's not a trustworthy fallback", () => {
    expect(clientIp(request({ "x-real-ip": "198.51.100.1" }))).toBe("unknown");
  });

  it("still prefers x-forwarded-for when both headers are present", () => {
    expect(clientIp(request({ "x-forwarded-for": "203.0.113.1", "x-real-ip": "198.51.100.1" }))).toBe(
      "203.0.113.1",
    );
  });
});
