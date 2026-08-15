import { z } from "zod";

/**
 * The four event formats shown on /events: Socials, Workshops,
 * Teamwochenende, Journeys — a fixed, confirmed set of four (same reasoning
 * as content/pillars.ts's three homepage pillars), not to be confused with
 * that unrelated file. `title` is real (the four names above, given
 * directly); the longer `detail` copy is not — see ASSETS-TODO.md. Both
 * live in messages/{locale}.json under "EventFormats.<key>"; this file only
 * holds the key, display order, and image slot.
 */

const eventFormatKeySchema = z.enum(["socials", "workshops", "teamweekend", "journeys"]);
export type EventFormatKey = z.infer<typeof eventFormatKeySchema>;

const eventFormatSchema = z.object({
  key: eventFormatKeySchema,
  order: z.number().int().min(1),
  image: z.string().nullable(),
});
export type EventFormat = z.infer<typeof eventFormatSchema>;

function eventFormat(key: EventFormatKey, order: number): EventFormat {
  return eventFormatSchema.parse({ key, order, image: null });
}

export const eventFormats: EventFormat[] = [
  eventFormat("socials", 1),
  eventFormat("workshops", 2),
  eventFormat("teamweekend", 3),
  eventFormat("journeys", 4),
];

export { eventFormatSchema, eventFormatKeySchema };
