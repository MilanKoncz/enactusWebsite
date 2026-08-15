import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { KontaktContent } from "@/components/sections/KontaktContent";

// Radix Accordion (inside Faq) doesn't need matchMedia, but keeping this
// consistent with every other test that renders a client-interactive
// section costs nothing and guards against a future dependency on it.
beforeEach(() => {
  mockMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("KontaktContent", () => {
  it("renders the page heading, the FAQ, and the contact form", () => {
    renderWithIntl(<KontaktContent />);
    expect(screen.getByRole("heading", { level: 1, name: "Sprechen wir." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Häufige Fragen" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Nachricht schreiben" })).toBeInTheDocument();
  });

  it("puts the FAQ before the contact form in document order — first on mobile, left on desktop", () => {
    renderWithIntl(<KontaktContent />);
    const faqHeading = screen.getByRole("heading", { level: 2, name: "Häufige Fragen" });
    const formHeading = screen.getByRole("heading", { level: 2, name: "Nachricht schreiben" });
    expect(
      faqHeading.compareDocumentPosition(formHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<KontaktContent />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
