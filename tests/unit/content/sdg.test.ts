import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { sdgIconSrc, SDG_GOAL_COUNT, SDG_GOALS_URL } from "@/content/sdg";
import deMessages from "@/messages/de.json";
import enMessages from "@/messages/en.json";

describe("content/sdg", () => {
  it("builds the zero-padded icon path for every goal", () => {
    expect(sdgIconSrc(1)).toBe("/sdg/sdg-01.jpg");
    expect(sdgIconSrc(9)).toBe("/sdg/sdg-09.jpg");
    expect(sdgIconSrc(17)).toBe("/sdg/sdg-17.jpg");
  });

  it("rejects a goal number outside 1-17", () => {
    expect(() => sdgIconSrc(0)).toThrow();
    expect(() => sdgIconSrc(18)).toThrow();
  });

  it("links to the official UN goals page", () => {
    expect(SDG_GOALS_URL).toBe("https://sdgs.un.org/goals");
  });

  it("ships a real icon file on disk for every one of the 17 goals", () => {
    for (let goal = 1; goal <= SDG_GOAL_COUNT; goal++) {
      const iconPath = resolve(process.cwd(), "public", sdgIconSrc(goal).replace(/^\//, ""));
      expect(existsSync(iconPath), `missing icon file for goal ${goal}`).toBe(true);
    }
  });

  it("has a German and English name for every one of the 17 goals", () => {
    for (let goal = 1; goal <= SDG_GOAL_COUNT; goal++) {
      expect(deMessages.Sdg.goals[String(goal) as keyof typeof deMessages.Sdg.goals]).toBeTruthy();
      expect(enMessages.Sdg.goals[String(goal) as keyof typeof enMessages.Sdg.goals]).toBeTruthy();
    }
  });
});
