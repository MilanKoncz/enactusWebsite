import { expect, test } from "@playwright/test";

// Easter egg 3/7 (docs/eastereggs.md). The peek button's own real timing
// (5-15s hidden before it appears) makes this the one e2e test on the site
// that needs real wall-clock time rather than a fake clock — Playwright's
// clock API doesn't reliably drive this component's own setTimeout chain
// through to a real click the way waiting for it does. 45s keeps a real
// margin over the component's own MAX_HIDDEN_MS (15s) plus the ~1s
// entering-to-active transition, on a CI runner slower than a local one.
test.describe("8-bit mode", () => {
  test.setTimeout(45_000);

  test("never lets a visitor scroll or pan into blank space on a narrow phone, even mid-activation", async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, "the reported bug — a widened mobile layout viewport — is a narrow-viewport case only");

    await page.goto("/");
    // Real wall-clock wait, not a fake clock: the peek button's own
    // hidden-phase delay (5-15s, randomBetween in EightBitEasterEgg.tsx)
    // is a real setTimeout chain that Playwright's clock API doesn't
    // reliably drive through to a genuine click — confirmed by hand, a
    // faked/advanced clock left the component's phase stuck at "off" even
    // after the button was force-clicked.
    await page.waitForTimeout(16_000);
    await page.getByRole("button", { name: "8-Bit-Modus aktivieren" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-eight-bit", "active", { timeout: 5_000 });

    // The bug this guards: html[data-eight-bit]'s font-family swap could
    // widen a hand-tuned nowrap string (HomeKpis.tsx's worldRankingDetail
    // span) past its container, which in turn widened the mobile browser's
    // own layout viewport — confirmed by hand to persist for as long as
    // the mode stays active, not a one-frame flash. A real touch drag is
    // the actual reported symptom (pan into blank space), not just
    // scrollX/scrollWidth, which don't reflect what a visitor can
    // physically pan to on a real phone.
    const viewportBefore = await page.evaluate(() => ({
      width: window.visualViewport?.width,
      offsetLeft: window.visualViewport?.offsetLeft,
    }));

    await page.mouse.move(350, 400);
    await page.mouse.down();
    for (let x = 350; x >= 50; x -= 30) {
      await page.mouse.move(x, 400);
    }
    await page.mouse.up();

    const viewportAfter = await page.evaluate(() => ({
      scrollX: window.scrollX,
      width: window.visualViewport?.width,
      offsetLeft: window.visualViewport?.offsetLeft,
    }));

    expect(viewportAfter.scrollX).toBe(0);
    expect(viewportAfter.offsetLeft).toBe(0);
    expect(viewportAfter.width).toBe(viewportBefore.width);
  });
});
