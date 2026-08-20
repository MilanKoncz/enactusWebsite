import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "../fixtures/intl";
import { nextNavigationMock } from "../fixtures/navigation";
import AdminLayout from "@/app/[locale]/admin/layout";

vi.mock("next/navigation", () => nextNavigationMock);

vi.mock("next-intl/server", async () => (await import("../fixtures/nextIntlServer")).nextIntlServerMock);

vi.mock("@/i18n/requireLocale", () => ({
  requireLocale: async () => "de",
}));

vi.mock("@/lib/adminSession", () => ({
  isAdminAuthenticated: async () => false,
}));

/**
 * Easter egg G (docs/eastereggs.md): the admin footer credit is a real link
 * to mkoncz.me, not just styled text. Rendered directly rather than through
 * adminPages.test.tsx's Page-level pattern — this is the one thing the
 * Layout itself owns that a Page render never exercises.
 */
describe("AdminLayout footer credit", () => {
  it("links the credit line to mkoncz.me, opening in a new tab", async () => {
    const ui = await AdminLayout({
      children: <div />,
      params: Promise.resolve({ locale: "de" }),
    });
    renderWithIntl(ui);

    const link = screen.getByRole("link", { name: "Designed and built by Milan Koncz" });
    expect(link).toHaveAttribute("href", "https://mkoncz.me");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link).toHaveAttribute("rel", expect.stringContaining("noreferrer"));
    expect(link).toHaveClass("link-underline");
  });
});
