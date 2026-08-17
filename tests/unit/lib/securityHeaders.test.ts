import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "@/lib/securityHeaders";

function header(key: string): string {
  const found = SECURITY_HEADERS.find((h) => h.key === key);
  if (!found) throw new Error(`Missing header: ${key}`);
  return found.value;
}

describe("SECURITY_HEADERS", () => {
  it("sets a Content-Security-Policy that closes the site to third-party frames", () => {
    const csp = header("Content-Security-Policy");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it("allows the YouTube facade's poster image and the youtube-nocookie embed", () => {
    const csp = header("Content-Security-Policy");
    expect(csp).toContain("https://i.ytimg.com");
    expect(csp).toContain("https://www.youtube-nocookie.com");
  });

  it("sets X-Frame-Options as a belt-and-braces clickjacking defense", () => {
    expect(header("X-Frame-Options")).toBe("DENY");
  });

  it("sets a strict Referrer-Policy", () => {
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("sets X-Content-Type-Options to stop MIME sniffing", () => {
    expect(header("X-Content-Type-Options")).toBe("nosniff");
  });

  it("denies every Permissions-Policy feature the site doesn't use", () => {
    const policy = header("Permissions-Policy");
    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
    expect(policy).toContain("geolocation=()");
    expect(policy).toContain("payment=()");
  });

  it("sets a long-lived Strict-Transport-Security policy", () => {
    const hsts = header("Strict-Transport-Security");
    expect(hsts).toContain("includeSubDomains");
    expect(hsts).toMatch(/max-age=\d{7,}/);
  });

  // Regression guard: this directive is redundant behind HTTPS-only
  // hosting plus HSTS, but it breaks http://localhost in WebKit — the
  // stylesheet and client bundle get upgraded to an https URL nothing
  // serves, so the page renders unstyled and never hydrates. That took
  // out 21 Mobile Safari e2e tests when it was first added.
  it("does not upgrade insecure requests, which would break http://localhost in WebKit", () => {
    expect(header("Content-Security-Policy")).not.toContain("upgrade-insecure-requests");
  });
});
