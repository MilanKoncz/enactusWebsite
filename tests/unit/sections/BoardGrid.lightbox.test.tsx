import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";

beforeEach(() => {
  mockMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// A separate mock/module instance from BoardGrid.test.tsx (Vitest scopes
// vi.mock per test file) so this can exercise the one real-photo case
// without touching that file's placeholder-only fixtures and counts.
vi.mock("@/content/board", () => ({
  board: [
    {
      slug: "thorben-ossig",
      name: "Jane Doe",
      role: "Vorstandsvorsitz",
      photo: "/board/jane-doe.webp",
      email: null,
      linkedinUrl: null,
    },
  ],
}));

const { BoardGrid } = await import("@/components/sections/BoardGrid");

describe("BoardGrid — portrait lightbox", () => {
  it("renders a real portrait behind a click-to-enlarge trigger", () => {
    renderWithIntl(<BoardGrid />);
    const trigger = screen.getByRole("button", { name: "Jane Doe vergrößern" });
    expect(trigger).toBeInTheDocument();
    expect(trigger.querySelector("img")).toBeInTheDocument();
  });

  it("opens the enlarged image in a dialog when the trigger is activated", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    renderWithIntl(<BoardGrid />);

    await user.click(screen.getByRole("button", { name: "Jane Doe vergrößern" }));

    expect(screen.getByRole("dialog", { name: "Jane Doe" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Schließen" })).toBeInTheDocument();
  });
});
