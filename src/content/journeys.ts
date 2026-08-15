import { z } from "zod";

/**
 * Group trips (Reisen) to Enactus National/World Cups, shown as a section on
 * /events. Real destinations and years confirmed by the board 2026-08-15
 * (see ASSETS-TODO.md), replacing the previous four generic placeholder
 * slots. Ordered most recent first, matching how the board listed them.
 */

const tripKeySchema = z.enum(["fss-2026", "fss-2025", "hws-2024", "fss-2024"]);
export type TripKey = z.infer<typeof tripKeySchema>;

const tripSchema = z.object({
  key: tripKeySchema,
  order: z.number().int().min(1),
  destination: z.string().nullable(),
  year: z.number().int().nullable(),
});
export type Trip = z.infer<typeof tripSchema>;

function trip(key: TripKey, order: number, destination: string, year: number): Trip {
  return tripSchema.parse({ key, order, destination, year });
}

export const trips: Trip[] = [
  trip("fss-2026", 1, "St. Gallen", 2026),
  trip("fss-2025", 2, "Berlin", 2025),
  trip("hws-2024", 3, "München", 2024),
  trip("fss-2024", 4, "Berlin", 2024),
];

export { tripSchema, tripKeySchema };
