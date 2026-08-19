import { z } from "zod";

/**
 * The five tool logos orbiting the circle beside the Benefits grid
 * (ToolOrbit.tsx) — purely decorative (aria-hidden), so unlike every other
 * content file there's no message-key copy attached: nothing here is ever
 * read aloud or displayed as text, only rendered as an image with an empty
 * alt. Notion/Canva/Claude/Google Workspace are real, from the board's media
 * handover (`neue medien/`), 2026-08-16. `openai` was added 2026-08-19: the
 * official 2025 "blossom" symbol mark, unmodified, from OpenAI's own brand
 * page (openai.com/brand blocks automated fetches with HTTP 403 — same
 * pattern as `horbach`/`eon-inhouse-consulting` in ASSETS-TODO.md — pulled
 * instead from Wikimedia Commons' mirror of the same 2025 mark,
 * public-domain-tagged there as too simple for copyright but still a live
 * OpenAI trademark, used here only to identify a tool the team actually
 * uses, the same nominative basis the other four logos are shown on).
 */

const toolKeySchema = z.enum(["notion", "canva", "claude", "googleWorkspace", "openai"]);
export type ToolKey = z.infer<typeof toolKeySchema>;

const toolSchema = z.object({
  key: toolKeySchema,
  order: z.number().int().min(1),
  logo: z.string(),
});
export type Tool = z.infer<typeof toolSchema>;

function tool(key: ToolKey, order: number, logo: string): Tool {
  return toolSchema.parse({ key, order, logo });
}

const TOOL_LOGOS: Record<ToolKey, string> = {
  notion: "/brand/tools/notion.png",
  canva: "/brand/tools/canva.png",
  claude: "/brand/tools/claude.png",
  googleWorkspace: "/brand/tools/google-workspace.png",
  openai: "/brand/tools/openai.svg",
};

export const tools: Tool[] = toolKeySchema.options.map((key, index) =>
  tool(key, index + 1, TOOL_LOGOS[key]),
);

export { toolSchema, toolKeySchema };
