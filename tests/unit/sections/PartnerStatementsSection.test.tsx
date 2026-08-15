import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { PartnerStatementsSection } from "@/components/sections/PartnerStatementsSection";
import { partnerStatements } from "@/content/partnerStatements";

describe("PartnerStatementsSection", () => {
  it("renders all four statements with a name and role", () => {
    renderWithIntl(<PartnerStatementsSection />);
    for (const statement of partnerStatements) {
      expect(screen.getByText(statement.name)).toBeInTheDocument();
    }
    expect(screen.getByText("Partner bei Horbach")).toBeInTheDocument();
  });

  it("keeps every quote at or under 200 characters", () => {
    const { container } = renderWithIntl(<PartnerStatementsSection />);
    const blockquotes = container.querySelectorAll("blockquote");
    expect(blockquotes.length).toBe(4);
    for (const quote of blockquotes) {
      const text = quote.textContent?.replace(/[""]/g, "") ?? "";
      expect(text.length).toBeLessThanOrEqual(200);
    }
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<PartnerStatementsSection />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
