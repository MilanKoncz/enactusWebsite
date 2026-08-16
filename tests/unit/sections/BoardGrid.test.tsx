import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";

// jsdom has no matchMedia at all; ProximityGroup (wrapping the portrait grid)
// reads it unconditionally on first render to decide whether to attach its
// pointer listener, so every test needs the mock even though none of them
// touch proximity behavior directly — see ProximityGroup.test.tsx for that.
beforeEach(() => {
  mockMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Slugs reuse two real entries from content/board.ts (thorben-ossig,
// anton-osuhovskiy) purely so the "Board.<slug>.bio" translation lookup
// resolves against the real message catalog — name/role/linkedinUrl below
// are otherwise arbitrary test data, unrelated to those two people.
vi.mock("@/content/board", () => ({
  board: [
    {
      slug: "thorben-ossig",
      name: "Jane Doe",
      role: "Vorstandsvorsitz",
      photo: null,
      email: null,
      linkedinUrl: "https://www.linkedin.com/in/jane-doe",
    },
    {
      slug: "anton-osuhovskiy",
      name: "John Doe",
      role: "Finanzen",
      photo: null,
      email: null,
      linkedinUrl: null,
    },
  ],
}));

const { BoardGrid } = await import("@/components/sections/BoardGrid");

describe("BoardGrid", () => {
  it("renders the section heading", () => {
    renderWithIntl(<BoardGrid />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Wer den Verein führt" }),
    ).toBeInTheDocument();
  });

  it("renders every board member's name and role", () => {
    renderWithIntl(<BoardGrid />);
    // Each name appears twice: once as the photo placeholder's label, once
    // as the name caption below it.
    expect(screen.getAllByText("Jane Doe")).toHaveLength(2);
    expect(screen.getByText("Vorstandsvorsitz")).toBeInTheDocument();
    expect(screen.getAllByText("John Doe")).toHaveLength(2);
    expect(screen.getByText("Finanzen")).toBeInTheDocument();
  });

  it("renders a real LinkedIn link (as an icon, labelled for screen readers) once a URL is confirmed", () => {
    renderWithIntl(<BoardGrid />);
    const link = screen.getByRole("link", { name: "LinkedIn-Profil von Jane Doe öffnen" });
    expect(link).toHaveAttribute("href", "https://www.linkedin.com/in/jane-doe");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(link.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the LinkedIn marker as a placeholder, not a dead link, while unconfirmed", () => {
    renderWithIntl(<BoardGrid />);
    expect(
      screen.queryByRole("link", { name: /John Doe/ }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("LinkedIn")).toHaveLength(1);
  });

  it("makes the real LinkedIn link keyboard-focusable directly, not only via the portrait column", () => {
    renderWithIntl(<BoardGrid />);
    const link = screen.getByRole("link", { name: "LinkedIn-Profil von Jane Doe öffnen" });
    link.focus();
    expect(link).toHaveFocus();
  });

  it("makes each portrait column keyboard-focusable, so the LinkedIn marker is reachable without a mouse", () => {
    renderWithIntl(<BoardGrid />);
    const placeholderMark = screen.getByText("LinkedIn");
    expect(placeholderMark.closest('[tabindex="0"]')).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "LinkedIn-Profil von Jane Doe öffnen" });
    expect(link.closest('[tabindex="0"]')).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<BoardGrid />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
