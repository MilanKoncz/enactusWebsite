import { expect, test } from "@playwright/test";

// request.fetch (not page.goto) so we can inspect the actual status code and
// redirect chain — page.goto only ever reports the final response.
test.describe("old Webflow URL redirects", () => {
  const cases: Array<[string, string]> = [
    ["/team", "/"],
    ["/innolab", "/prozess"],
    ["/faq", "/kontakt"],
    ["/differgy", "/projekte/differgy"],
    ["/mealyo", "/projekte/mealyo"],
    ["/impact-with-us", "/projekte/impactwithus"],
    ["/smilegreen", "/projekte/smilegreen"],
    ["/safesteps", "/projekte/safesteps"],
    ["/safe-steps", "/projekte/safesteps"],
    ["/vela", "/projekte/vela"],
  ];

  for (const [from, to] of cases) {
    test(`redirects ${from} to ${to} with a 301, not a 302`, async ({ request, baseURL }) => {
      const response = await request.fetch(`${baseURL}${from}`, { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      expect(new URL(response.headers().location!, baseURL).pathname).toBe(to);
    });
  }

  test("routes that already exist at the same path are not redirected at all", async ({
    request,
    baseURL,
  }) => {
    for (const path of ["/projekte", "/mitmachen", "/kontakt", "/partner"]) {
      const response = await request.fetch(`${baseURL}${path}`, { maxRedirects: 0 });
      expect(response.status(), path).toBe(200);
    }
  });
});

test.describe("sitemap.xml and robots.txt", () => {
  test("sitemap.xml lists both locales for the homepage and excludes /styleguide", async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(`${baseURL}/sitemap.xml`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("hreflang=\"de\"");
    expect(body).toContain("hreflang=\"en\"");
    expect(body).not.toContain("styleguide");
  });

  test("robots.txt disallows /styleguide and points at the sitemap", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/robots.txt`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("Disallow: /styleguide");
    expect(body).toContain("Sitemap:");
  });
});
