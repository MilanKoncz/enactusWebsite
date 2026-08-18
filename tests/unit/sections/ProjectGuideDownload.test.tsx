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

  it("links straight to the real PDF, opening in a new tab", () => {
    expect(projectGuide.available).toBe(true);
    renderWithIntl(<ProjectGuideDownload />);
    const link = screen.getByRole("link", { name: "Project Guide herunterladen" });
    expect(link).toHaveAttribute("href", projectGuide.href);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("shows the file format and size next to the download link", () => {
    renderWithIntl(<ProjectGuideDownload />);
    expect(screen.getByText(`PDF · ${projectGuide.fileSizeLabel}`)).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderWithIntl(<ProjectGuideDownload />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
