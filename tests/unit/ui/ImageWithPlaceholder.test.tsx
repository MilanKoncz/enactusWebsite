import { describe, expect, it } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import { ImageWithPlaceholder } from "@/components/ui/ImageWithPlaceholder";

describe("ImageWithPlaceholder", () => {
  it("covers the photo with a pulsing wash before load", () => {
    const { container } = render(
      <div style={{ position: "relative" }}>
        <ImageWithPlaceholder src="/test.jpg" alt="" fill sizes="100vw" />
      </div>,
    );
    const wash = container.querySelector('[aria-hidden="true"]')!;
    expect(wash.className).toContain("opacity-100");
    expect(wash.className).toContain("animate-pulse");
  });

  it("fades the wash out once the image loads, without touching the image's own classes", async () => {
    const { container } = render(
      <div style={{ position: "relative" }}>
        <ImageWithPlaceholder src="/test.jpg" alt="" fill sizes="100vw" className="object-cover custom-class" />
      </div>,
    );
    const img = container.querySelector("img")!;
    const classesBeforeLoad = img.className;
    fireEvent.load(img);

    const wash = container.querySelector('[aria-hidden="true"]')!;
    await waitFor(() => {
      expect(wash.className).toContain("opacity-0");
    });
    expect(wash.className).not.toContain("animate-pulse");
    // The <img>'s own className (a caller's object-fit, hover-zoom
    // transition, whatever it needs) is never rewritten by this component —
    // see the component's own comment on why the fade lives on the wash,
    // not on the photo.
    expect(img.className).toBe(classesBeforeLoad);
    expect(img.className).toContain("object-cover");
    expect(img.className).toContain("custom-class");
  });

  it("never renders a spinner or text inside the placeholder wash", () => {
    const { container } = render(
      <div style={{ position: "relative" }}>
        <ImageWithPlaceholder src="/test.jpg" alt="" fill sizes="100vw" />
      </div>,
    );
    const wash = container.querySelector('[aria-hidden="true"]')!;
    expect(wash.textContent).toBe("");
    expect(wash.children).toHaveLength(0);
  });

  it("keeps the wash out of the way of pointer interaction with the photo", () => {
    const { container } = render(
      <div style={{ position: "relative" }}>
        <ImageWithPlaceholder src="/test.jpg" alt="" fill sizes="100vw" />
      </div>,
    );
    const wash = container.querySelector('[aria-hidden="true"]')!;
    expect(wash.className).toContain("pointer-events-none");
  });

  it("resets to the placeholder wash if src changes on the same instance", async () => {
    const { container, rerender } = render(
      <div style={{ position: "relative" }}>
        <ImageWithPlaceholder src="/first.jpg" alt="" fill sizes="100vw" />
      </div>,
    );
    fireEvent.load(container.querySelector("img")!);
    const wash = container.querySelector('[aria-hidden="true"]')!;
    await waitFor(() => {
      expect(wash.className).toContain("opacity-0");
    });

    rerender(
      <div style={{ position: "relative" }}>
        <ImageWithPlaceholder src="/second.jpg" alt="" fill sizes="100vw" />
      </div>,
    );
    expect(container.querySelector('[aria-hidden="true"]')!.className).toContain("opacity-100");
  });

  it("keeps a real alt on the image itself, not just on the decorative wash", () => {
    const { container } = render(
      <div style={{ position: "relative" }}>
        <ImageWithPlaceholder src="/test.jpg" alt="Team photo" fill sizes="100vw" />
      </div>,
    );
    expect(container.querySelector("img")).toHaveAttribute("alt", "Team photo");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <div style={{ position: "relative" }}>
        <ImageWithPlaceholder src="/test.jpg" alt="Team photo" fill sizes="100vw" />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
