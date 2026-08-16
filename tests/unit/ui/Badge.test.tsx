import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it.each([
    ["active", "Aktiv"],
    ["spinoff", "Ausgegründet"],
    ["paused", "Pausiert"],
    ["cancelled", "Beendet"],
  ] as const)("renders the %s status label", (status, label) => {
    render(<Badge status={status}>{label}</Badge>);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it.each([
    ["active", true],
    ["spinoff", true],
    ["paused", false],
    ["cancelled", false],
  ] as const)("status %s is filled, not just colored, when filled=%s", (status, filled) => {
    render(<Badge status={status}>Status</Badge>);
    const badge = screen.getByText("Status");
    expect(badge.className.includes("bg-transparent")).toBe(!filled);
  });

  it("has no accessibility violations across all statuses", async () => {
    const { container } = render(
      <>
        <Badge status="active">Aktiv</Badge>
        <Badge status="spinoff">Ausgegründet</Badge>
        <Badge status="paused">Pausiert</Badge>
        <Badge status="cancelled">Beendet</Badge>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
