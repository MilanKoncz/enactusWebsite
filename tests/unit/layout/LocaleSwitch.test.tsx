import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockPathname } from "../../fixtures/navigation";
import { LocaleSwitch } from "@/components/layout/LocaleSwitch";

vi.mock("next/navigation", async () => (await import("../../fixtures/navigation")).nextNavigationMock);

describe("LocaleSwitch", () => {
  it("on a German route, the EN link adds the /en prefix instead of forcing one on DE", () => {
    mockPathname.mockReturnValue("/projekte");
    renderWithIntl(<LocaleSwitch />, { locale: "de" });
    expect(screen.getByRole("link", { name: "EN" })).toHaveAttribute("href", "/en/projekte");
  });

  it("on an English route, the DE link drops the /en prefix instead of keeping it", () => {
    mockPathname.mockReturnValue("/projekte");
    renderWithIntl(<LocaleSwitch />, { locale: "en" });
    expect(screen.getByRole("link", { name: "DE" })).toHaveAttribute("href", "/projekte");
  });

  it("marks the current locale with aria-current, and only that one", () => {
    mockPathname.mockReturnValue("/projekte");
    renderWithIntl(<LocaleSwitch />, { locale: "de" });
    expect(screen.getByRole("link", { name: "DE" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "EN" })).not.toHaveAttribute("aria-current");
  });

  it("has no accessibility violations", async () => {
    mockPathname.mockReturnValue("/projekte");
    const { container } = renderWithIntl(<LocaleSwitch />, { locale: "de" });
    expect(await axe(container)).toHaveNoViolations();
  });
});
