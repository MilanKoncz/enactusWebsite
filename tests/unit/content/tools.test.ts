import { describe, expect, it } from "vitest";
import { toolKeySchema, toolSchema, tools } from "@/content/tools";

describe("content/tools", () => {
  it("lists the four tools in order", () => {
    expect(tools.map((t) => t.key)).toEqual(["notion", "canva", "claude", "googleWorkspace"]);
    expect(tools.map((t) => t.order)).toEqual([1, 2, 3, 4]);
  });

  it("has a real logo path for every tool", () => {
    for (const t of tools) {
      expect(t.logo).toMatch(/^\/brand\/tools\//);
    }
  });

  it("validates every exported tool against the schema", () => {
    for (const t of tools) {
      expect(() => toolSchema.parse(t)).not.toThrow();
    }
  });

  it("rejects a tool with an unknown key", () => {
    expect(() => toolSchema.parse({ key: "slack", order: 1, logo: "/brand/tools/slack.png" })).toThrow();
  });

  it("keeps the key enum in sync with the exported tool list", () => {
    expect(toolKeySchema.options).toEqual(tools.map((t) => t.key));
  });
});
