import { afterEach, describe, expect, it } from "vitest";
import { isProductionDeployment } from "@/lib/productionDeployment";

afterEach(() => {
  delete process.env.NEXT_PUBLIC_VERCEL_ENV;
});

describe("isProductionDeployment", () => {
  it("is true on the bare domain with NEXT_PUBLIC_VERCEL_ENV=production", () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
    expect(isProductionDeployment("enactus-mannheim.com")).toBe(true);
  });

  it("is true on the www subdomain with NEXT_PUBLIC_VERCEL_ENV=production", () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
    expect(isProductionDeployment("www.enactus-mannheim.com")).toBe(true);
  });

  it("is false when NEXT_PUBLIC_VERCEL_ENV is unset, even on the real host", () => {
    delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    expect(isProductionDeployment("enactus-mannheim.com")).toBe(false);
  });

  it("is false for preview and development environments, even on the real host", () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
    expect(isProductionDeployment("enactus-mannheim.com")).toBe(false);
    process.env.NEXT_PUBLIC_VERCEL_ENV = "development";
    expect(isProductionDeployment("enactus-mannheim.com")).toBe(false);
  });

  it("is false on the Vercel-generated alias, even with NEXT_PUBLIC_VERCEL_ENV=production", () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
    expect(isProductionDeployment("enactus-mannheim-website.vercel.app")).toBe(false);
  });

  it("is false for a null host", () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
    expect(isProductionDeployment(null)).toBe(false);
  });

  it("is false for localhost", () => {
    process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
    expect(isProductionDeployment("localhost:3000")).toBe(false);
  });
});
