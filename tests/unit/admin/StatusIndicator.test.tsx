import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { MailStatusIndicator, StatusIndicator } from "@/components/admin/StatusIndicator";

describe("StatusIndicator", () => {
  it("renders the label as visible text for every level, never color alone", () => {
    for (const level of ["ok", "warning", "error", "neutral"] as const) {
      const { unmount, container } = render(<StatusIndicator level={level} label={`Level ${level}`} />);
      expect(screen.getByText(`Level ${level}`)).toBeInTheDocument();
      expect(container.querySelector("svg")).toBeInTheDocument();
      unmount();
    }
  });

  it("uses distinct colors for ok, warning, and error", () => {
    const { container: ok } = render(<StatusIndicator level="ok" label="OK" />);
    const { container: warning } = render(<StatusIndicator level="warning" label="Warnung" />);
    const { container: error } = render(<StatusIndicator level="error" label="Fehler" />);
    expect(ok.querySelector(".text-moss")).toBeInTheDocument();
    expect(warning.querySelector(".text-amber")).toBeInTheDocument();
    expect(error.querySelector(".text-oxblood")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <StatusIndicator level="ok" label="Erreichbar" />
        <StatusIndicator level="warning" label="Achtung" />
        <StatusIndicator level="error" label="Fehler" />
        <StatusIndicator level="neutral" label="Ausstehend" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("MailStatusIndicator", () => {
  it("maps pending to neutral, sent to ok, and failed to error", () => {
    const { container: pending } = render(<MailStatusIndicator status="pending" label="ausstehend" />);
    const { container: sent } = render(<MailStatusIndicator status="sent" label="gesendet" />);
    const { container: failed } = render(<MailStatusIndicator status="failed" label="fehlgeschlagen" />);
    expect(pending.querySelector(".opacity-60")).toBeInTheDocument();
    expect(sent.querySelector(".text-moss")).toBeInTheDocument();
    expect(failed.querySelector(".text-oxblood")).toBeInTheDocument();
  });
});
