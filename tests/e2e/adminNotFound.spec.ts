import { expect, test } from "@playwright/test";

// Unlike the public 404 (tests/e2e/not-found.spec.ts), /admin's not-found
// route has no login gate to clear first — Next resolves it purely from the
// URL not matching any admin route, before AdminLayout's session check ever
// runs, so this reaches the real page unauthenticated same as a logged-in
// board member would.
test.describe("admin 404 page", () => {
  test("still answers with a real 404 status code", async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/admin/this-does-not-exist`);
    expect(response.status()).toBe(404);
  });

  test("shows the admin-specific 404 copy and a way back to the overview", async ({ page }) => {
    await page.goto("/admin/this-does-not-exist");
    await expect(page.getByRole("heading", { name: "Diese Adminseite gibt es nicht." })).toBeVisible();
    await expect(page.getByRole("link", { name: "Zur Übersicht" })).toHaveAttribute("href", "/admin");
  });
});
