import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { render } from "@testing-library/react";
import { mockMatchMedia } from "../../fixtures/matchMedia";
import { HeroVideo } from "@/components/motion/HeroVideo";

// jsdom has no media pipeline: HTMLMediaElement.play/pause are stubs that
// log "not implemented" and never resolve, so they are replaced outright
// (a plain prototype assignment, so afterEach puts the originals back by
// hand — restoreAllMocks cannot undo it).
const originalPlay = window.HTMLMediaElement.prototype.play;
const originalPause = window.HTMLMediaElement.prototype.pause;

let play: Mock<() => Promise<void>>;
let pause: Mock<() => void>;

beforeEach(() => {
  play = vi.fn<() => Promise<void>>(() => Promise.resolve());
  pause = vi.fn<() => void>();
  window.HTMLMediaElement.prototype.play = play;
  window.HTMLMediaElement.prototype.pause = pause;
});

afterEach(() => {
  window.HTMLMediaElement.prototype.play = originalPlay;
  window.HTMLMediaElement.prototype.pause = originalPause;
  vi.unstubAllGlobals();
});

/** matchMedia stub that answers each query from a lookup table. */
function mockQueries(matches: Record<string, boolean>) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({
      matches: matches[query] ?? false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  );
}

describe("HeroVideo", () => {
  it("carries the real poster and source, muted, looping and inline", () => {
    mockMatchMedia(false);
    const { container } = render(<HeroVideo />);
    const video = container.querySelector("video")!;
    expect(video).toHaveAttribute("poster", "/video/hero-poster.png");
    expect(video.querySelector("source")).toHaveAttribute("src", "/video/hero-video.mp4");
    expect(video).toHaveProperty("muted", true);
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");
  });

  // Without this the browser fetches all 43 MB on a phone, where the element
  // is display:none and can never be seen.
  it("never preloads the file itself", () => {
    mockMatchMedia(false);
    const { container } = render(<HeroVideo />);
    expect(container.querySelector("video")).toHaveAttribute("preload", "none");
  });

  it("plays at desktop width when motion is welcome", () => {
    mockQueries({ "(min-width: 768px)": true, "(prefers-reduced-motion: reduce)": false });
    render(<HeroVideo />);
    expect(play).toHaveBeenCalled();
  });

  it("never starts under a reduced-motion preference", () => {
    mockQueries({ "(min-width: 768px)": true, "(prefers-reduced-motion: reduce)": true });
    render(<HeroVideo />);
    expect(play).not.toHaveBeenCalled();
    expect(pause).toHaveBeenCalled();
  });

  it("never starts below the breakpoint that shows it", () => {
    mockQueries({ "(min-width: 768px)": false, "(prefers-reduced-motion: reduce)": false });
    render(<HeroVideo />);
    expect(play).not.toHaveBeenCalled();
  });

  // The play() promise rejects whenever a browser declines autoplay; the
  // poster stays and nothing else may break.
  it("swallows a refused play() instead of throwing", async () => {
    play.mockImplementation(() => Promise.reject(new Error("NotAllowedError")));
    mockQueries({ "(min-width: 768px)": true, "(prefers-reduced-motion: reduce)": false });
    expect(() => render(<HeroVideo />)).not.toThrow();
    await Promise.resolve();
  });
});
