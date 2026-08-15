import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { YouTubeFacade } from "@/components/ui/YouTubeFacade";

describe("YouTubeFacade", () => {
  it("renders a play button with the poster image, no iframe yet", () => {
    render(<YouTubeFacade youtubeId="9Ord09u363s" title="Moufense" playLabel="Pitch von Moufense ansehen" />);
    expect(screen.getByRole("button", { name: "Pitch von Moufense ansehen" })).toBeInTheDocument();
    expect(screen.queryByTitle("Moufense")).not.toBeInTheDocument();
  });

  it("uses YouTube's own static thumbnail as the poster, not a request to the embed itself", () => {
    // alt="" (purely decorative, the button carries the accessible name) drops
    // the image out of the "img" role, same reasoning as Logo.test.tsx —
    // queried via the DOM directly instead of getByRole.
    const { container } = render(
      <YouTubeFacade youtubeId="9Ord09u363s" title="Moufense" playLabel="Pitch von Moufense ansehen" />,
    );
    const poster = container.querySelector("img");
    expect(poster).toHaveAttribute("alt", "");
    const src = poster?.getAttribute("src") ?? "";
    expect(src).toContain("i.ytimg.com");
    expect(src).toContain("9Ord09u363s");
  });

  it("mounts the youtube-nocookie.com iframe only after the button is clicked", async () => {
    const user = userEvent.setup();
    render(<YouTubeFacade youtubeId="9Ord09u363s" title="Moufense" playLabel="Pitch von Moufense ansehen" />);

    await user.click(screen.getByRole("button", { name: "Pitch von Moufense ansehen" }));

    const iframe = screen.getByTitle("Moufense");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/9Ord09u363s?autoplay=1");
    expect(screen.queryByRole("button", { name: "Pitch von Moufense ansehen" })).not.toBeInTheDocument();
  });

  // Only the facade (poster/button) state is checked here — axe-core tries to
  // postMessage into the real <iframe> jsdom renders once loaded, which has
  // no working contentWindow in this environment and throws regardless of
  // the markup's actual accessibility. tests/e2e/projekte.spec.ts covers the
  // loaded state in a real browser instead.
  it("has no accessibility violations in the unloaded facade state", async () => {
    const { container } = render(
      <YouTubeFacade youtubeId="9Ord09u363s" title="Moufense" playLabel="Pitch von Moufense ansehen" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
