import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "../../fixtures/intl";
import { mockIntersectionObserver } from "../../fixtures/observers";
import { mockMatchMedia } from "../../fixtures/matchMedia";

beforeEach(() => {
  HTMLElement.prototype.scrollTo = vi.fn();
  mockIntersectionObserver();
  mockMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// A separate mock/module instance from AlumniVoices.test.tsx, which uses the
// real (currently all-placeholder) content/alumni.ts — this exercises the
// one real-photo case on its own fixture instead.
vi.mock("@/content/alumni", () => ({
  alumni: [
    {
      slug: "alumna-1",
      name: "Alex Beispiel",
      currentRole: "Gründerin, Beispiel GmbH",
      quote: "Ein Zitat.",
      linkedinUrl: null,
      photo: "/alumni/alex-beispiel.webp",
    },
  ],
}));

const { AlumniVoices } = await import("@/components/sections/AlumniVoices");

describe("AlumniVoices — photo lightbox", () => {
  it("renders a real alumnus photo behind a click-to-enlarge trigger", () => {
    renderWithIntl(<AlumniVoices />);
    const trigger = screen.getByRole("button", { name: "Alex Beispiel vergrößern" });
    expect(trigger).toBeInTheDocument();
    expect(trigger.querySelector("img")).toBeInTheDocument();
  });

  it("opens the enlarged image in a dialog when the trigger is activated", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AlumniVoices />);

    await user.click(screen.getByRole("button", { name: "Alex Beispiel vergrößern" }));

    expect(screen.getByRole("dialog", { name: "Alex Beispiel" })).toBeInTheDocument();
  });
});
