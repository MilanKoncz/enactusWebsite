import { z } from "zod";

/**
 * The four Enactus Germany events shown on /events, below the journeys
 * history — a fixed, confirmed set of four (same reasoning as
 * content/eventFormats.ts's four formats and content/pillars.ts's three
 * homepage pillars). `abbreviation`, `title` and `description` are copy and
 * live in messages/{locale}.json under "EgEvents.<key>"; this file only
 * holds the key, display order, and the real event photo (board media
 * handover, "EG Events/", 2026-08-18).
 */

const egEventKeySchema = z.enum(["nc", "esa", "oew", "twe"]);
export type EgEventKey = z.infer<typeof egEventKeySchema>;

const egEventSchema = z.object({
  key: egEventKeySchema,
  order: z.number().int().min(1),
  image: z.string().startsWith("/"),
});
export type EgEvent = z.infer<typeof egEventSchema>;

function egEvent(key: EgEventKey, order: number, image: string): EgEvent {
  return egEventSchema.parse({ key, order, image });
}

export const egEvents: EgEvent[] = [
  egEvent("nc", 1, "/events/eg-national-cup.jpg"),
  egEvent("esa", 2, "/events/eg-startup-accelerator.jpg"),
  egEvent("oew", 3, "/events/eg-one-enactus-weekend.jpg"),
  egEvent("twe", 4, "/events/eg-trainingswochenende.jpg"),
];

export { egEventSchema, egEventKeySchema };
