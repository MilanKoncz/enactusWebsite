import { z } from "zod";

/**
 * The four event formats shown on /events: Socials, Workshops,
 * Teamwochenende, Gala — a fixed, confirmed set of four (same reasoning as
 * content/pillars.ts's three homepage pillars), not to be confused with
 * that unrelated file. `title` is real (the four names above, given
 * directly); the longer `detail` copy is not — see ASSETS-TODO.md. Both
 * live in messages/{locale}.json under "EventFormats.<key>"; this file only
 * holds the key, display order, and image slot.
 *
 * `journeys` was the fourth format until 2026-08-16 — dropped in favor of
 * `gala` per board feedback: the trip history already gets its own detailed
 * section right below this one (JourneysSection.tsx / content/journeys.ts),
 * so listing it a second time as a format tile here was redundant. Real
 * photos (board media handover, `neue medien/`) exist for `socials`,
 * `workshops`, and `gala`; `teamweekend` stays `null` until one exists.
 */

const eventFormatKeySchema = z.enum(["socials", "workshops", "teamweekend", "gala"]);
export type EventFormatKey = z.infer<typeof eventFormatKeySchema>;

const eventFormatSchema = z.object({
  key: eventFormatKeySchema,
  order: z.number().int().min(1),
  image: z.string().nullable(),
});
export type EventFormat = z.infer<typeof eventFormatSchema>;

function eventFormat(key: EventFormatKey, order: number, image: string | null): EventFormat {
  return eventFormatSchema.parse({ key, order, image });
}

export const eventFormats: EventFormat[] = [
  eventFormat("socials", 1, "/events/socials.webp"),
  eventFormat("workshops", 2, "/events/workshops.webp"),
  eventFormat("teamweekend", 3, null),
  eventFormat("gala", 4, "/events/gala.webp"),
];

export { eventFormatSchema, eventFormatKeySchema };
