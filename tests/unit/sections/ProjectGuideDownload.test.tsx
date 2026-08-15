import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ProjectGuideDownload } from "@/components/sections/ProjectGuideDownload";
import { projectGuide } from "@/content/process";

describe("ProjectGuideDownload", () => {
  it("renders the section heading", () => {
    renderWithIntl(<ProjectGuideDownload />);
    expect(screen.getByRole("heading", { name: "Project Guide" })).toBeInTheDocument();
  });

  it("disables the download button while the PDF is unavailable", () => {
    expect(projectGuide.available).toBe(false);
    renderWithIntl(<ProjectGuideDownload />);
    expect(screen.getByRole("button", { name: "Project Guide herunterladen" })).toBeDisabled();
  });

  it("makes the unavailability reason reachable via the button's accessible description", () => {
    renderWithIntl(<ProjectGuideDownload />);
    const button = screen.getByRole("button", { name: "Project Guide herunterladen" });
    const describedBy = button.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();

    const hint = document.getElementById(describedBy!);
    expect(hint).toHaveTextContent("Der Project Guide ist noch nicht verfügbar.");
    expect(hint).toBeVisible();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ProjectGuideDownload />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
