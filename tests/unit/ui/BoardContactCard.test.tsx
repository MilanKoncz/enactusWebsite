import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { BoardContactCard } from "@/components/ui/BoardContactCard";
import type { BoardMember } from "@/content/board";

const MEMBER: BoardMember = {
  slug: "test-member",
  name: "Test Mitglied",
  role: "Inno-Lead",
  photo: "/image/board/test.jpg",
  email: "test@unimannheim.enactus.team",
  linkedinUrl: null,
};

describe("BoardContactCard", () => {
  it("renders the member's name, role, and a mailto CTA", () => {
    render(
      <BoardContactCard
        member={MEMBER}
        eyebrow="Direkter Kontakt"
        title="Hast du eine Frage?"
        lead="Schreib mir einfach."
        cta="Nachricht schreiben"
      />,
    );

    expect(screen.getByText("Test Mitglied")).toBeInTheDocument();
    expect(screen.getByText("Inno-Lead")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nachricht schreiben" })).toHaveAttribute(
      "href",
      "mailto:test@unimannheim.enactus.team",
    );
  });

  it("omits the CTA when the member has no email", () => {
    render(
      <BoardContactCard
        member={{ ...MEMBER, email: null }}
        eyebrow="Direkter Kontakt"
        title="Hast du eine Frage?"
        lead="Schreib mir einfach."
        cta="Nachricht schreiben"
      />,
    );

    expect(screen.queryByRole("link", { name: "Nachricht schreiben" })).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <BoardContactCard
        member={MEMBER}
        eyebrow="Direkter Kontakt"
        title="Hast du eine Frage?"
        lead="Schreib mir einfach."
        cta="Nachricht schreiben"
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
