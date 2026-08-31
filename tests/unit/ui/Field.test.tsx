import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { Field } from "@/components/ui/Field";

describe("Field", () => {
  it("associates the label with the input via htmlFor/id", () => {
    render(<Field label="E-Mail-Adresse" name="email" />);
    expect(screen.getByLabelText("E-Mail-Adresse")).toBeInTheDocument();
  });

  it("renders a textarea when as='textarea'", () => {
    render(<Field as="textarea" label="Nachricht" name="message" />);
    expect(screen.getByLabelText("Nachricht").tagName).toBe("TEXTAREA");
  });

  it("renders a select when as='select', with its options as children", () => {
    render(
      <Field as="select" label="Fachbereich" name="department">
        <option value="wi">Wirtschaftsinformatik</option>
        <option value="bwl">BWL</option>
      </Field>,
    );
    const select = screen.getByLabelText("Fachbereich");
    expect(select.tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "BWL" })).toBeInTheDocument();
  });

  it("links a hint via aria-describedby when there is no error", () => {
    render(<Field label="Telefon" name="phone" hint="Optional, für Rückfragen" />);
    const input = screen.getByLabelText("Telefon");
    expect(screen.getByText("Optional, für Rückfragen")).toHaveAttribute(
      "id",
      input.getAttribute("aria-describedby"),
    );
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("marks the field invalid and links the error via aria-describedby, not color alone", () => {
    render(<Field label="E-Mail-Adresse" name="email" error="Bitte gültige E-Mail-Adresse angeben" />);
    const input = screen.getByLabelText("E-Mail-Adresse");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const error = screen.getByText("Bitte gültige E-Mail-Adresse angeben");
    expect(error).toHaveAttribute("id", input.getAttribute("aria-describedby"));
    // Errors carry an icon alongside the text, not color alone.
    expect(error.querySelector("svg")).toBeInTheDocument();
  });

  it("prefers the error over the hint when both are given, without a dangling aria-describedby reference", () => {
    render(
      <Field
        label="E-Mail-Adresse"
        name="email"
        hint="Wir antworten innerhalb von 3 Tagen"
        error="Bitte gültige E-Mail-Adresse angeben"
      />,
    );
    expect(screen.queryByText("Wir antworten innerhalb von 3 Tagen")).not.toBeInTheDocument();
    const input = screen.getByLabelText("E-Mail-Adresse");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBe(screen.getByText("Bitte gültige E-Mail-Adresse angeben").id);
  });

  it("accepts keyboard input", async () => {
    const user = userEvent.setup();
    render(<Field label="Name" name="name" />);
    const input = screen.getByLabelText("Name");
    await user.type(input, "Ada Lovelace");
    expect(input).toHaveValue("Ada Lovelace");
  });

  it("renders an endAdornment inside the input's own relative wrapper, padding the control clear of it", () => {
    render(
      <Field
        label="Passwort"
        name="password"
        type="password"
        endAdornment={<button type="button">Anzeigen</button>}
      />,
    );
    const input = screen.getByLabelText("Passwort");
    expect(input).toHaveClass("pr-10");
    expect(screen.getByRole("button", { name: "Anzeigen" })).toBeInTheDocument();
  });

  it("does not render a counter for a textarea without showCount", () => {
    render(<Field as="textarea" label="Nachricht" name="message" maxLength={300} />);
    expect(screen.queryByText(/^\d+ \/ \d+$/)).not.toBeInTheDocument();
  });

  it("shows a live 0 / max count once showCount and maxLength are both set", () => {
    render(<Field as="textarea" label="Begründung" name="reason" showCount maxLength={300} />);
    expect(screen.getByText("0 / 300")).toBeInTheDocument();
  });

  it("updates the count as the visitor types, without swallowing onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Field as="textarea" label="Begründung" name="reason" showCount maxLength={300} onChange={onChange} />,
    );
    await user.type(screen.getByLabelText("Begründung"), "Hallo");
    expect(screen.getByText("5 / 300")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledTimes(5);
  });

  it("links the count via aria-describedby alongside the hint", () => {
    render(
      <Field as="textarea" label="Skills" name="skills" showCount maxLength={200} hint="Optional, max. 200 Zeichen." />,
    );
    const textarea = screen.getByLabelText("Skills");
    const describedBy = textarea.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(describedBy).toContain(screen.getByText("0 / 200").id);
    expect(describedBy).toContain(screen.getByText("Optional, max. 200 Zeichen.").id);
  });

  it("has no accessibility violations for input, textarea, select and error states", async () => {
    const { container } = render(
      <>
        <Field label="Name" name="name" />
        <Field as="textarea" label="Nachricht" name="message" hint="Freitext" />
        <Field as="select" label="Fachbereich" name="department">
          <option value="wi">Wirtschaftsinformatik</option>
        </Field>
        <Field label="E-Mail-Adresse" name="email" error="Bitte gültige E-Mail-Adresse angeben" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
