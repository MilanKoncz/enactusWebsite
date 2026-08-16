import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { renderWithIntl } from "../../fixtures/intl";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

function renderLightbox() {
  return renderWithIntl(
    <ImageLightbox src="/projects/example.webp" alt="SmileGreen">
      <span>thumbnail</span>
    </ImageLightbox>,
  );
}

describe("ImageLightbox", () => {
  it("is closed until its trigger is activated", () => {
    renderLightbox();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SmileGreen vergrößern" })).toBeInTheDocument();
  });

  it("opens the enlarged image, labelled by its alt text, on click", async () => {
    const user = userEvent.setup();
    renderLightbox();

    await user.click(screen.getByRole("button", { name: "SmileGreen vergrößern" }));

    const dialog = screen.getByRole("dialog", { name: "SmileGreen" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "SmileGreen" })).toBeInTheDocument();
  });

  it("opens on Enter, the trigger being a real button", async () => {
    const user = userEvent.setup();
    renderLightbox();

    const trigger = screen.getByRole("button", { name: "SmileGreen vergrößern" });
    trigger.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderLightbox();

    const trigger = screen.getByRole("button", { name: "SmileGreen vergrößern" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes via the visible close button", async () => {
    const user = userEvent.setup();
    renderLightbox();

    await user.click(screen.getByRole("button", { name: "SmileGreen vergrößern" }));
    await user.click(screen.getByRole("button", { name: "Schließen" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no accessibility violations, closed or open", async () => {
    const user = userEvent.setup();
    const { container } = renderLightbox();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: "SmileGreen vergrößern" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
