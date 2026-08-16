import { z } from "zod";

/**
 * The four tool logos orbiting the semicircle beside the Benefits grid
 * (ToolOrbit.tsx) — purely decorative (aria-hidden), so unlike every other
 * content file there's no message-key copy attached: nothing here is ever
 * read aloud or displayed as text, only rendered as an image with an empty
 * alt. Logos are real, from the board's media handover (`neue medien/`),
 * 2026-08-16.
 */

const toolKeySchema = z.enum(["notion", "canva", "claude", "googleWorkspace"]);
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
};

export const tools: Tool[] = toolKeySchema.options.map((key, index) =>
  tool(key, index + 1, TOOL_LOGOS[key]),
);

export { toolSchema, toolKeySchema };
