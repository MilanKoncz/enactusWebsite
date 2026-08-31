import { describe, expect, it } from "vitest";
import {
  applicationFormSchema,
  CV_REQUIRED,
  MAX_DEPARTMENTS,
  MOTIVATION_MAX,
  WANT_TO_GAIN_MAX,
  toAreaChoices,
  validatedApplicationFormSchema,
} from "@/lib/applicationFormSchema";

function validCv() {
  return {
    cvBlobUrl: "https://example-store.private.blob.vercel-storage.com/bewerbungen/lebenslauf-abc123.pdf",
    cvPathname: "bewerbungen/lebenslauf-abc123.pdf",
    cvOriginalFilename: "Lebenslauf Jane Doe.pdf",
    cvSizeBytes: 123456,
  };
}

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    studyProgram: "BWL",
    semester: "3",
    availabilityHours: "10",
    area1: "SmileGreen",
    area1Reason: "Weil ich dort am meisten bewirken kann.",
    motivation: "Ich möchte gerne aktiv an einem Projekt mitarbeiten und Verantwortung übernehmen.",
    consent: true,
    ...(CV_REQUIRED ? validCv() : {}),
    ...overrides,
  };
}

describe("applicationFormSchema (field-level rules, no cross-field refinement)", () => {
  it("accepts a minimal valid application with the optional fields omitted", () => {
    const result = applicationFormSchema.safeParse(validInput());
    expect(result.success).toBe(true);
  });

  it("coerces semester and availabilityHours to numbers", () => {
    const result = applicationFormSchema.parse(validInput());
    expect(result.semester).toBe(3);
    expect(result.availabilityHours).toBe(10);
  });

  it("no longer has a university field", () => {
    const result = applicationFormSchema.safeParse(validInput());
    expect(result.success).toBe(true);
    expect(result.success && "university" in result.data).toBe(false);
  });

  it("rejects a submission without consent", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), consent: false });
    expect(result.success).toBe(false);
  });

  it("rejects a motivation shorter than 20 characters", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), motivation: "Zu kurz." });
    expect(result.success).toBe(false);
  });

  it(`rejects a motivation over ${MOTIVATION_MAX} characters`, () => {
    const result = applicationFormSchema.safeParse({
      ...validInput(),
      motivation: "x".repeat(MOTIVATION_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it(`accepts exactly ${MOTIVATION_MAX} characters for motivation`, () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), motivation: "x".repeat(MOTIVATION_MAX) });
    expect(result.success).toBe(true);
  });

  it("rejects a missing first-choice area", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), area1: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing first-choice reason", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), area1Reason: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a first-choice reason over 300 characters", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), area1Reason: "x".repeat(301) });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 300 characters for a reason", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), area1Reason: "x".repeat(300) });
    expect(result.success).toBe(true);
  });

  it("rejects a filled honeypot field", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), website: "https://spam.example" });
    expect(result.success).toBe(false);
  });

  it("accepts a filled priorInvolvement, languagesSkills, and wantToGain within their limits", () => {
    const result = applicationFormSchema.safeParse({
      ...validInput(),
      priorInvolvement: "Ehrenamt im Verein.",
      languagesSkills: "Figma, Excel-Modelle, Spanisch (C1).",
      wantToGain: "Praxiserfahrung im Projektmanagement.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a priorInvolvement over 600 characters", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), priorInvolvement: "x".repeat(601) });
    expect(result.success).toBe(false);
  });

  it("rejects languagesSkills over 200 characters — shorter than before, deliberately", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), languagesSkills: "x".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("accepts exactly 200 characters for languagesSkills", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), languagesSkills: "x".repeat(200) });
    expect(result.success).toBe(true);
  });

  it(`rejects wantToGain over ${WANT_TO_GAIN_MAX} characters`, () => {
    const result = applicationFormSchema.safeParse({
      ...validInput(),
      wantToGain: "x".repeat(WANT_TO_GAIN_MAX + 1),
    });
    expect(result.success).toBe(false);
  });

  it(`accepts exactly ${WANT_TO_GAIN_MAX} characters for wantToGain`, () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), wantToGain: "x".repeat(WANT_TO_GAIN_MAX) });
    expect(result.success).toBe(true);
  });

  it("accepts departments omitted entirely", () => {
    const result = applicationFormSchema.safeParse(validInput());
    expect(result.success).toBe(true);
  });

  it("accepts an empty departments array", () => {
    const result = applicationFormSchema.safeParse({ ...validInput(), departments: [] });
    expect(result.success).toBe(true);
  });

  it(`accepts exactly ${MAX_DEPARTMENTS} departments`, () => {
    const result = applicationFormSchema.safeParse({
      ...validInput(),
      departments: Array.from({ length: MAX_DEPARTMENTS }, (_, index) => `Ressort ${index + 1}`),
    });
    expect(result.success).toBe(true);
  });

  it(`rejects more than ${MAX_DEPARTMENTS} departments`, () => {
    const result = applicationFormSchema.safeParse({
      ...validInput(),
      departments: Array.from({ length: MAX_DEPARTMENTS + 1 }, (_, index) => `Ressort ${index + 1}`),
    });
    expect(result.success).toBe(false);
  });
});

describe("validatedApplicationFormSchema — department cross-field rules", () => {
  it("rejects the same department chosen twice", () => {
    const result = validatedApplicationFormSchema.safeParse(
      validInput({ departments: ["Team-Lead", "Team-Lead"] }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts distinct departments", () => {
    const result = validatedApplicationFormSchema.safeParse(
      validInput({ departments: ["Team-Lead", "Finance-Lead"] }),
    );
    expect(result.success).toBe(true);
  });
});

describe("validatedApplicationFormSchema — area choice cross-field rules", () => {
  it("accepts a single, first-choice-only submission", () => {
    const result = validatedApplicationFormSchema.safeParse(validInput());
    expect(result.success).toBe(true);
  });

  it("accepts area1 and area2 with both reasons filled in", () => {
    const result = validatedApplicationFormSchema.safeParse(
      validInput({ area2: "Mealyo", area2Reason: "Zweitwahl, weil ich auch dort mitwirken möchte." }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts area1, area2, and area3 with every reason filled in", () => {
    const result = validatedApplicationFormSchema.safeParse(
      validInput({
        area2: "Mealyo",
        area2Reason: "Zweitwahl, weil ich auch dort mitwirken möchte.",
        area3: "ReSoap",
        area3Reason: "Drittwahl aus Interesse an Nachhaltigkeit.",
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects area2 chosen without a reason", () => {
    const result = validatedApplicationFormSchema.safeParse(validInput({ area2: "Mealyo" }));
    expect(result.success).toBe(false);
  });

  it("rejects a reason given without an area chosen", () => {
    const result = validatedApplicationFormSchema.safeParse(
      validInput({ area2Reason: "Ich hätte eine Begründung, aber keinen Bereich gewählt." }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a 3rd choice without a 2nd — no gaps", () => {
    const result = validatedApplicationFormSchema.safeParse(
      validInput({ area3: "ReSoap", area3Reason: "Drittwahl aus Interesse an Nachhaltigkeit." }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects area3 chosen without its own reason, even with area2 present", () => {
    const result = validatedApplicationFormSchema.safeParse(
      validInput({
        area2: "Mealyo",
        area2Reason: "Zweitwahl, weil ich auch dort mitwirken möchte.",
        area3: "ReSoap",
      }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects the same area chosen twice (1st and 2nd)", () => {
    const result = validatedApplicationFormSchema.safeParse(
      validInput({ area2: "SmileGreen", area2Reason: "Nochmal derselbe Bereich." }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects the same area chosen for 1st and 3rd, with a valid 2nd in between", () => {
    const result = validatedApplicationFormSchema.safeParse(
      validInput({
        area2: "Mealyo",
        area2Reason: "Zweitwahl, weil ich auch dort mitwirken möchte.",
        area3: "SmileGreen",
        area3Reason: "Nochmal derselbe Bereich wie die Erstwahl.",
      }),
    );
    expect(result.success).toBe(false);
  });
});

describe("validatedApplicationFormSchema — CV requiredness", () => {
  it(`CV_REQUIRED is currently ${CV_REQUIRED}`, () => {
    // Documents the constant's current value in the test output so a
    // flip is visible in a diff of test names, not just source.
    expect(typeof CV_REQUIRED).toBe("boolean");
  });

  it("rejects a submission with no CV data when CV_REQUIRED is true", () => {
    const result = validatedApplicationFormSchema.safeParse(validInput({ ...noCv() }));
    expect(result.success).toBe(CV_REQUIRED ? false : true);
  });

  it("accepts a submission with a complete CV upload", () => {
    const result = validatedApplicationFormSchema.safeParse(validInput({ ...validCv() }));
    expect(result.success).toBe(true);
  });

  it("rejects a submission with only some of the four CV fields present", () => {
    const result = validatedApplicationFormSchema.safeParse(
      validInput({ ...noCv(), cvPathname: "bewerbungen/lebenslauf-abc123.pdf" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects a CV size over 4 MB", () => {
    const result = applicationFormSchema.safeParse(validInput({ ...validCv(), cvSizeBytes: 4 * 1024 * 1024 + 1 }));
    expect(result.success).toBe(false);
  });
});

function noCv() {
  return {
    cvBlobUrl: undefined,
    cvPathname: undefined,
    cvOriginalFilename: undefined,
    cvSizeBytes: undefined,
  };
}

describe("toAreaChoices", () => {
  it("returns only the first choice when 2nd and 3rd are absent", () => {
    expect(toAreaChoices({ area1: "SmileGreen", area1Reason: "Begründung 1" })).toEqual([
      { priority: 1, areaLabel: "SmileGreen", reason: "Begründung 1" },
    ]);
  });

  it("returns choices in priority order for all three", () => {
    expect(
      toAreaChoices({
        area1: "SmileGreen",
        area1Reason: "Begründung 1",
        area2: "Mealyo",
        area2Reason: "Begründung 2",
        area3: "ReSoap",
        area3Reason: "Begründung 3",
      }),
    ).toEqual([
      { priority: 1, areaLabel: "SmileGreen", reason: "Begründung 1" },
      { priority: 2, areaLabel: "Mealyo", reason: "Begründung 2" },
      { priority: 3, areaLabel: "ReSoap", reason: "Begründung 3" },
    ]);
  });
});
