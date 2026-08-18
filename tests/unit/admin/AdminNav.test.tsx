import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockPathname, nextNavigationMock } from "../../fixtures/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { ADMIN_SECTIONS } from "@/components/admin/adminSections";

vi.mock("next/navigation", () => nextNavigationMock);

afterEach(() => {
  vi.resetAllMocks();
});

describe("AdminNav", () => {
  it("links the overview and every admin section", () => {
    mockPathname.mockReturnValue("/admin");
    renderWithIntl(<AdminNav />);

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("/admin");
    for (const section of ADMIN_SECTIONS) {
      expect(hrefs).toContain(section.href);
    }
  });

  it("marks only the current section with aria-current", () => {
    mockPathname.mockReturnValue("/admin/mails");
    renderWithIntl(<AdminNav />);

    const current = screen.getAllByRole("link").filter((link) => link.getAttribute("aria-current") === "page");
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAttribute("href", "/admin/mails");
  });

  it("does not mark the overview as current on a sub-page", () => {
    mockPathname.mockReturnValue("/admin/bewerbungen");
    renderWithIntl(<AdminNav />);

    const overview = screen.getByRole("link", { name: "Übersicht" });
    expect(overview).not.toHaveAttribute("aria-current");
  });

  it("gives every link, including the overview, its own icon", () => {
    mockPathname.mockReturnValue("/admin");
    renderWithIntl(<AdminNav />);

    for (const link of screen.getAllByRole("link")) {
      expect(link.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("exposes itself as a named navigation landmark", () => {
    mockPathname.mockReturnValue("/admin");
    renderWithIntl(<AdminNav />);

    expect(screen.getByRole("navigation", { name: "Adminbereiche" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mockPathname.mockReturnValue("/admin/bewerbungen");
    const { container } = renderWithIntl(<AdminNav />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
