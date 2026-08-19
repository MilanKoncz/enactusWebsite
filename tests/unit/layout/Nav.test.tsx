import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockPathname } from "../../fixtures/navigation";
import { Nav } from "@/components/layout/Nav";

vi.mock("next/navigation", async () => (await import("../../fixtures/navigation")).nextNavigationMock);

describe("Nav", () => {
  it("renders all five header nav links with correct hrefs", () => {
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Nav />);
    expect(screen.getByRole("link", { name: "Prozess" })).toHaveAttribute("href", "/prozess");
    expect(screen.getByRole("link", { name: "Projekte" })).toHaveAttribute("href", "/projekte");
    expect(screen.getByRole("link", { name: "Events" })).toHaveAttribute("href", "/events");
    expect(screen.getByRole("link", { name: "Partner" })).toHaveAttribute("href", "/partner");
    expect(screen.getByRole("link", { name: "Kontakt" })).toHaveAttribute("href", "/kontakt");
  });

  it("marks the current route with aria-current, and only that route", () => {
    mockPathname.mockReturnValue("/projekte");
    renderWithIntl(<Nav />);
    expect(screen.getByRole("link", { name: "Projekte" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Prozess" })).not.toHaveAttribute("aria-current");
  });

  it("marks no item current when the route matches none of them", () => {
    mockPathname.mockReturnValue("/mitmachen");
    renderWithIntl(<Nav />);
    for (const name of ["Prozess", "Projekte", "Events", "Partner", "Kontakt"]) {
      expect(screen.getByRole("link", { name })).not.toHaveAttribute("aria-current");
    }
  });

  it("still marks the parent route current on a nested path", () => {
    mockPathname.mockReturnValue("/projekte/wasserfilter");
    renderWithIntl(<Nav />);
    expect(screen.getByRole("link", { name: "Projekte" })).toHaveAttribute("aria-current", "page");
  });

  it("has no accessibility violations", async () => {
    mockPathname.mockReturnValue("/");
    const { container } = renderWithIntl(<Nav />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("omits 'Jobs' by default (showJobs unset)", () => {
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Nav />);
    expect(screen.queryByRole("link", { name: "Jobs" })).not.toBeInTheDocument();
  });

  it("shows 'Jobs', right after Termine, when showJobs is true", () => {
    mockPathname.mockReturnValue("/");
    renderWithIntl(<Nav showJobs />);
    const links = screen.getAllByRole("link").map((link) => link.textContent);
    const termineIndex = links.indexOf("Termine");
    expect(links[termineIndex + 1]).toBe("Jobs");
    expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute("href", "/jobs");
  });
});
