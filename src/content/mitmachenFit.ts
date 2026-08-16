import { z } from "zod";

/**
 * The two four-field lists on /mitmachen ("Was wir von dir erwarten" /
 * "Was du bekommst"). A fixed, confirmed count of four each — the brief is
 * explicit about that shape. The key enums, not free strings, so
 * `t(\`expectations.${item.key}.title\`)` in MitmachenFit.tsx stays
 * statically checked against messages/{locale}.json (the same reasoning as
 * content/stars.ts). `title`/`lead`/`detail` are copy and live in
 * messages/{locale}.json under "MitmachenPage.fit.expectations.<key>" /
 * "...offers.<key>"; this file only holds the key and display order.
 *
 * Draft copy, not yet confirmed by the board — same status as
 * content/benefits.ts, tracked in ASSETS-TODO.md.
 */

const expectationKeySchema = z.enum(["agency", "time", "ownership", "teamwork"]);
export type ExpectationKey = z.infer<typeof expectationKeySchema>;

const offerKeySchema = z.enum(["responsibility", "network", "mentoring", "growth"]);
export type OfferKey = z.infer<typeof offerKeySchema>;

const expectationSchema = z.object({ key: expectationKeySchema, order: z.number().int().min(1) });
export type Expectation = z.infer<typeof expectationSchema>;

const offerSchema = z.object({ key: offerKeySchema, order: z.number().int().min(1) });
export type Offer = z.infer<typeof offerSchema>;

export const expectations: Expectation[] = expectationKeySchema.options.map((key, index) =>
  expectationSchema.parse({ key, order: index + 1 }),
);

export const offers: Offer[] = offerKeySchema.options.map((key, index) =>
  offerSchema.parse({ key, order: index + 1 }),
);

export { expectationKeySchema, expectationSchema, offerKeySchema, offerSchema };
