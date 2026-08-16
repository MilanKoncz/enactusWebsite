import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { FormStatusMessage } from "@/components/ui/FormStatusMessage";

describe("FormStatusMessage", () => {
  it("renders a success message with role=status and a checkmark icon", () => {
    render(<FormStatusMessage variant="success">Alles klar.</FormStatusMessage>);
    const message = screen.getByRole("status");
    expect(message).toHaveTextContent("Alles klar.");
    expect(message.querySelector("svg")).toBeInTheDocument();
  });

  it("renders an error message with role=alert and a warning icon", () => {
    render(<FormStatusMessage variant="error">Etwas ist schiefgelaufen.</FormStatusMessage>);
    const message = screen.getByRole("alert");
    expect(message).toHaveTextContent("Etwas ist schiefgelaufen.");
    expect(message.querySelector("svg")).toBeInTheDocument();
  });

  it("gives success and error visibly different styling, not just an icon swap", () => {
    render(<FormStatusMessage variant="success">Erfolg</FormStatusMessage>);
    const success = screen.getByRole("status");
    render(<FormStatusMessage variant="error">Fehler</FormStatusMessage>);
    const error = screen.getByRole("alert");

    expect(success.className).toContain("moss");
    expect(error.className).toContain("oxblood");
    expect(success.className).not.toBe(error.className);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <FormStatusMessage variant="success">Erfolg</FormStatusMessage>
        <FormStatusMessage variant="error">Fehler</FormStatusMessage>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
