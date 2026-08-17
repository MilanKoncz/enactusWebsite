import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import proxy from "@/proxy";

afterEach(() => {
  delete process.env.VERCEL_ENV;
});

function requestFor(host: string, path = "/") {
  return new NextRequest(`https://${host}${path}`, { headers: { host } });
}

describe("proxy", () => {
  it("adds X-Robots-Tag: noindex when VERCEL_ENV isn't production", () => {
    process.env.VERCEL_ENV = "preview";
    const response = proxy(requestFor("enactus-mannheim.com"));
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  });

  it("adds X-Robots-Tag: noindex on the Vercel-generated alias, even in production", () => {
    process.env.VERCEL_ENV = "production";
    const response = proxy(requestFor("enactus-mannheim-website.vercel.app"));
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  });

  it("does not add X-Robots-Tag on the confirmed production host in production", () => {
    process.env.VERCEL_ENV = "production";
    const response = proxy(requestFor("enactus-mannheim.com"));
    expect(response.headers.get("X-Robots-Tag")).toBeNull();
  });

  it("does not add X-Robots-Tag on the www host in production", () => {
    process.env.VERCEL_ENV = "production";
    const response = proxy(requestFor("www.enactus-mannheim.com"));
    expect(response.headers.get("X-Robots-Tag")).toBeNull();
  });

  it("404s the /en-prefixed admin route — it only ever answers at /admin", () => {
    const response = proxy(requestFor("enactus-mannheim.com", "/en/admin/bewerbungen"));
    expect(response.status).toBe(404);
  });

  it("404s the bare /en/admin path too", () => {
    const response = proxy(requestFor("enactus-mannheim.com", "/en/admin"));
    expect(response.status).toBe(404);
  });

  it("leaves the unprefixed /admin route to next-intl's own routing", () => {
    const response = proxy(requestFor("enactus-mannheim.com", "/admin/bewerbungen"));
    expect(response.status).not.toBe(404);
  });
});
