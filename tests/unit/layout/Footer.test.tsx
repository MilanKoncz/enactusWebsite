import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { mockPathname, nextNavigationMock } from "../../fixtures/navigation";

vi.mock("@/content/navigation", async () => {
  const actual = await vi.importActual<typeof import("@/content/navigation")>(
    "@/content/navigation",
  );
  return {
    ...actual,
    networkLinks: [
      { key: "enactusGermany", href: "https://www.enactus.de" },
      { key: "enactusGlobal", href: null },
    ],
  };
});

vi.mock("next/navigation", () => nextNavigationMock);

const { Footer } = await import("@/components/layout/Footer");

// Footer now also renders EightBitEasterEgg (docs/eastereggs.md), which
// needs both a pathname (to check the excluded-route list) and
// window.matchMedia (usePrefersReducedMotion) — neither existed before
// that component, so every Footer test needs them now too.
beforeEach(() => {
  mockPathname.mockReturnValue("/");
  mockMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Footer", () => {
  it("exposes a contentinfo landmark containing the claim", () => {
    renderWithIntl(<Footer />);
    expect(
      within(screen.getByRole("contentinfo")).getByText("Entrepreneurial. Action. Us."),
    ).toBeInTheDocument();
  });

  it("renders all three columns with correct internal hrefs", () => {
    renderWithIntl(<Footer />);
    expect(screen.getByRole("link", { name: "Partner" })).toHaveAttribute("href", "/partner");
    expect(screen.getByRole("link", { name: "Prozess" })).toHaveAttribute("href", "/prozess");
    expect(screen.getByRole("link", { name: "Impressum" })).toHaveAttribute("href", "/impressum");
    expect(screen.getByRole("link", { name: "Datenschutz" })).toHaveAttribute(
      "href",
      "/datenschutz",
    );
  });

  it("renders a confirmed external link as a real link, target=_blank", () => {
    renderWithIntl(<Footer />);
    const link = screen.getByRole("link", { name: "Enactus Germany" });
    expect(link).toHaveAttribute("href", "https://www.enactus.de");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("renders an unconfirmed external link as a Placeholder, not a dead link", () => {
    renderWithIntl(<Footer />);
    expect(screen.queryByRole("link", { name: "Enactus Global" })).not.toBeInTheDocument();
    expect(screen.getByText("Enactus Global")).toBeInTheDocument();
  });

  it("renders a real icon next to every social link, including LinkedIn", () => {
    renderWithIntl(<Footer />);
    const socialGroup = screen.getByRole("group", { name: "Social Media" });
    for (const name of ["Instagram", "LinkedIn", "Facebook"]) {
      const link = within(socialGroup).getByRole("link", { name });
      expect(link.parentElement?.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<Footer />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("omits the 'Jobs' link by default (hasJobs unset)", () => {
    renderWithIntl(<Footer />);
    expect(screen.queryByRole("link", { name: "Jobs" })).not.toBeInTheDocument();
  });

  it("adds a 'Jobs' link to the association column when hasJobs is true", () => {
    renderWithIntl(<Footer hasJobs />);
    expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute("href", "/jobs");
  });
});
