import { z } from "zod";

/**
 * Current board (Vorstand) roster, confirmed by the board 2026-08-15 (see
 * ASSETS-TODO.md). `role` stays a free string rather than an enum: the
 * actual set of board roles isn't a fixed structure worth encoding, and a
 * future handover could reshuffle it. Bios live in messages/ under
 * "Board.<slug>.bio"; this file only holds the roster structure. Portraits
 * are real as of 2026-08-16 (board media handover); `photo` stays nullable
 * so a future handover can drop back to a placeholder per member instead of
 * needing a fabricated path.
 */

const boardMemberSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  role: z.string(),
  photo: z.string().nullable(),
  email: z.email().nullable(),
  linkedinUrl: z.url().nullable(),
});
export type BoardMember = z.infer<typeof boardMemberSchema>;

function member(input: z.input<typeof boardMemberSchema>): BoardMember {
  return boardMemberSchema.parse({ ...input});
}

export const board: BoardMember[] = [
  member({
    slug: "thorben-ossig",
    name: "Thorben Ossig",
    role: "Team-Lead",
    photo: "/image/board/Thorben.jpg",
    email: "thorben.ossig@unimannheim.enactus.team",
    linkedinUrl: "https://www.linkedin.com/in/thorben-o-06600a31a",
  }),
  member({
    slug: "anton-osuhovskiy",
    name: "Anton Osuhovskiy",
    role: "Finance-Lead",
    photo: "/image/board/Anton.jpg",
    email: "anton.osuhovskiy@unimannheim.enactus.team",
    // No LinkedIn profile given — a confirmed absence, not a gap to chase.
    linkedinUrl: null,
  }),
  member({
    slug: "tom-iizuka",
    name: "Tom Iizuka",
    role: "Operations-Lead",
    photo: "/image/board/Tom.jpg",
    email: "tom.iizuka@unimannheim.enactus.team",
    linkedinUrl: "https://www.linkedin.com/in/tom-iizuka-678770399",
  }),
  member({
    slug: "philip-strobl",
    name: "Philip Strobl",
    role: "Inno-Lead",
    photo: "/image/board/Philip.jpg",
    email: "philip.strobl@unimannheim.enactus.team",
    linkedinUrl: "https://www.linkedin.com/in/philip-strobl-5015a4356",
  }),
  member({
    slug: "risto-terhart",
    name: "Risto Terhart",
    role: "C&C Lead",
    photo: "/image/board/Risto.jpg",
    email: "risto.terhart@unimannheim.enactus.team",
    linkedinUrl: "https://www.linkedin.com/in/risto-terhart-28ba56229",
  }),
];

export { boardMemberSchema };
