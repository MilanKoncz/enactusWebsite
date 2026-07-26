import { z } from "zod";

/**
 * Upcoming and past events (recruiting info sessions, workshops, network
 * meetups). No real dates or locations are known yet, so this holds four
 * placeholder entries rather than an empty array, so the events layout can
 * be judged before the board provides a real calendar (see
 * ASSETS-TODO.md). `title` is a message key under messages/{locale}.json's
 * "Events.<slug>.title", not copy itself.
 */

const eventSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  date: z.iso.date().nullable(),
  location: z.string().nullable(),
  externalUrl: z.url().nullable(),
});
export type Event = z.infer<typeof eventSchema>;

function placeholderEvent(index: number): Event {
  const slug = `event-${index}`;
  return eventSchema.parse({
    slug,
    title: `Events.${slug}.title`,
    date: null,
    location: null,
    externalUrl: null,
  });
}

export const events: Event[] = [1, 2, 3, 4].map(placeholderEvent);

export { eventSchema };
