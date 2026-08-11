/**
 * §26.1 — the pitch form's field contract (§11.2).
 *
 * The same schema runs on the client and on the server, where it is
 * authoritative, so every boundary is tested at both edges: an off-by-one here
 * is the difference between a founder losing a 3000-character description and
 * a founder being told to trim one word.
 */

import { describe, expect, it } from "vitest";
import {
  MAX_FUNDING_EUR,
  PITCH_FIELD_LABELS,
  pitchAntiSpamSchema,
  pitchFormSchema,
  pitchRequestSchema,
  toFieldErrors,
} from "@/lib/validation/pitch";

const ONE_LINE_30 = "a".repeat(30);
const DESCRIPTION_100 = "b".repeat(100);

/** A payload that satisfies every required field, in the form's own input shape. */
function validPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    country: "Sweden",
    firstName: "Fixture",
    lastName: "Founder",
    email: "founder@example.com",
    companyName: "Testcorp Fixture",
    stage: "MVP",
    fundingRaisedEur: 0,
    oneLinePitch: ONE_LINE_30,
    description: DESCRIPTION_100,
    privacyConsent: true,
    ...overrides,
  };
}

function errorsFor(payload: Record<string, unknown>): Record<string, string> {
  const result = pitchFormSchema.safeParse(payload);
  if (result.success) return {};
  return toFieldErrors(result.error);
}

describe("required fields", () => {
  it("accepts a minimal complete submission", () => {
    const result = pitchFormSchema.safeParse(validPayload());
    expect(result.success).toBe(true);
  });

  it("reports every missing required field, keyed by field name", () => {
    const errors = errorsFor({});

    for (const field of [
      "country",
      "firstName",
      "lastName",
      "email",
      "companyName",
      "stage",
      "fundingRaisedEur",
      "oneLinePitch",
      "description",
      "privacyConsent",
    ]) {
      expect(errors, `expected an error for ${field}`).toHaveProperty(field);
      // Every key the summary can render must have a human label to render it with.
      expect(PITCH_FIELD_LABELS[field]).toBeTruthy();
    }
  });

  it("rejects a blank or whitespace-only name", () => {
    expect(errorsFor(validPayload({ firstName: "" }))).toHaveProperty("firstName");
    expect(errorsFor(validPayload({ lastName: "   " }))).toHaveProperty("lastName");
  });

  it("rejects a country or stage outside the published options", () => {
    expect(errorsFor(validPayload({ country: "Atlantis" }))).toHaveProperty("country");
    expect(errorsFor(validPayload({ stage: "Series Z" }))).toHaveProperty("stage");
  });
});

describe("length bounds", () => {
  it("enforces the one-line pitch at both edges", () => {
    expect(errorsFor(validPayload({ oneLinePitch: "a".repeat(29) }))).toHaveProperty(
      "oneLinePitch",
    );
    expect(pitchFormSchema.safeParse(validPayload({ oneLinePitch: "a".repeat(30) })).success).toBe(
      true,
    );
    expect(pitchFormSchema.safeParse(validPayload({ oneLinePitch: "a".repeat(400) })).success).toBe(
      true,
    );
    expect(errorsFor(validPayload({ oneLinePitch: "a".repeat(401) }))).toHaveProperty(
      "oneLinePitch",
    );
  });

  it("enforces the description at both edges", () => {
    expect(errorsFor(validPayload({ description: "b".repeat(99) }))).toHaveProperty("description");
    expect(pitchFormSchema.safeParse(validPayload({ description: "b".repeat(100) })).success).toBe(
      true,
    );
    expect(pitchFormSchema.safeParse(validPayload({ description: "b".repeat(3000) })).success).toBe(
      true,
    );
    expect(errorsFor(validPayload({ description: "b".repeat(3001) }))).toHaveProperty(
      "description",
    );
  });

  it("measures the trimmed value, so padding neither passes nor fails a field", () => {
    const padded = `   ${ONE_LINE_30}   `;
    const result = pitchFormSchema.safeParse(validPayload({ oneLinePitch: padded }));

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.oneLinePitch).toBe(ONE_LINE_30);

    // 29 real characters plus padding is still 29 real characters.
    expect(errorsFor(validPayload({ oneLinePitch: `  ${"a".repeat(29)}  ` }))).toHaveProperty(
      "oneLinePitch",
    );
  });
});

describe("fundingRaisedEur", () => {
  it("accepts 0 as the explicit 'we have not raised' answer", () => {
    const result = pitchFormSchema.safeParse(validPayload({ fundingRaisedEur: 0 }));

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fundingRaisedEur).toBe(0);
  });

  it("rejects a negative amount", () => {
    expect(errorsFor(validPayload({ fundingRaisedEur: -1 }))).toHaveProperty("fundingRaisedEur");
  });

  it("accepts the maximum and rejects anything above it", () => {
    expect(
      pitchFormSchema.safeParse(validPayload({ fundingRaisedEur: MAX_FUNDING_EUR })).success,
    ).toBe(true);
    expect(errorsFor(validPayload({ fundingRaisedEur: MAX_FUNDING_EUR + 1 }))).toHaveProperty(
      "fundingRaisedEur",
    );
  });

  it("rejects a non-integer amount", () => {
    expect(errorsFor(validPayload({ fundingRaisedEur: 100.5 }))).toHaveProperty("fundingRaisedEur");
  });

  it("rejects a value that is not a number at all", () => {
    expect(errorsFor(validPayload({ fundingRaisedEur: "50000" }))).toHaveProperty(
      "fundingRaisedEur",
    );
    expect(errorsFor(validPayload({ fundingRaisedEur: Number.NaN }))).toHaveProperty(
      "fundingRaisedEur",
    );
  });
});

describe('conditional "other" fields', () => {
  it("requires the free-text answer when the option is Other", () => {
    expect(errorsFor(validPayload({ country: "Other" }))).toHaveProperty("countryOther");
    expect(errorsFor(validPayload({ stage: "Other" }))).toHaveProperty("stageOther");
    expect(errorsFor(validPayload({ source: "other" }))).toHaveProperty("sourceOther");
  });

  it("accepts the free-text answer when it is supplied", () => {
    const result = pitchFormSchema.safeParse(
      validPayload({
        country: "Other",
        countryOther: "Estonia",
        stage: "Other",
        stageOther: "Between prototype and pilot",
        source: "other",
        sourceOther: "A founder we both know",
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countryOther).toBe("Estonia");
      expect(result.data.stageOther).toBe("Between prototype and pilot");
      expect(result.data.sourceOther).toBe("A founder we both know");
    }
  });

  it("drops a stale free-text answer instead of storing an inconsistent record", () => {
    const result = pitchFormSchema.safeParse(
      validPayload({
        country: "Sweden",
        countryOther: "Estonia",
        stage: "MVP",
        stageOther: "Between prototype and pilot",
        source: "referral",
        sourceOther: "A founder we both know",
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.countryOther).toBeUndefined();
      expect(result.data.stageOther).toBeUndefined();
      expect(result.data.sourceOther).toBeUndefined();
    }
  });
});

describe("email", () => {
  it("normalises to lowercase and trims", () => {
    const result = pitchFormSchema.safeParse(validPayload({ email: "  Founder@Example.COM " }));

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("founder@example.com");
  });

  it("rejects an address that is not an address", () => {
    expect(errorsFor(validPayload({ email: "founder@" }))).toHaveProperty("email");
    expect(errorsFor(validPayload({ email: "founder example.com" }))).toHaveProperty("email");
  });
});

describe("optional URL fields", () => {
  const urlFields = ["companyWebsite", "deckUrl", "loomUrl"] as const;

  it("treats an empty string as 'not answered'", () => {
    for (const field of urlFields) {
      const result = pitchFormSchema.safeParse(validPayload({ [field]: "" }));
      expect(result.success, `${field} should accept an empty string`).toBe(true);
      if (result.success) expect(result.data[field]).toBeUndefined();
    }
  });

  it("accepts an http(s) URL", () => {
    const result = pitchFormSchema.safeParse(
      validPayload({
        companyWebsite: "https://example.com",
        deckUrl: "https://example.com/deck.pdf",
        loomUrl: "http://example.com/walkthrough",
      }),
    );

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.deckUrl).toBe("https://example.com/deck.pdf");
  });

  it("rejects a javascript: URL", () => {
    for (const field of urlFields) {
      expect(
        errorsFor(validPayload({ [field]: "javascript:alert(document.domain)" })),
        `${field} must reject javascript:`,
      ).toHaveProperty(field);
    }
  });

  it("rejects other non-http(s) schemes and free text", () => {
    expect(errorsFor(validPayload({ deckUrl: "data:text/html,<script>" }))).toHaveProperty(
      "deckUrl",
    );
    expect(errorsFor(validPayload({ deckUrl: "our deck is attached" }))).toHaveProperty("deckUrl");
  });
});

describe("privacyConsent", () => {
  it("must be true", () => {
    expect(errorsFor(validPayload({ privacyConsent: false }))).toHaveProperty("privacyConsent");
    expect(errorsFor(validPayload({ privacyConsent: undefined }))).toHaveProperty("privacyConsent");
    expect(errorsFor(validPayload({ privacyConsent: "yes" }))).toHaveProperty("privacyConsent");
  });
});

describe("anti-spam envelope", () => {
  it("rejects a filled honeypot and accepts an empty one", () => {
    expect(pitchAntiSpamSchema.safeParse({ website2: "" }).success).toBe(true);
    expect(pitchAntiSpamSchema.safeParse({}).success).toBe(true);
    expect(pitchAntiSpamSchema.safeParse({ website2: "http://spam.example" }).success).toBe(false);
  });

  it("carries the anti-spam fields alongside a valid submission", () => {
    const result = pitchRequestSchema.safeParse({
      ...validPayload(),
      website2: "",
      renderedAt: 1_700_000_000_000,
      submissionId: "3f4c8b2e-1d6a-4f5b-9c7e-2a1b3c4d5e6f",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a submission id that is not a uuid", () => {
    const result = pitchRequestSchema.safeParse({ ...validPayload(), submissionId: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("toFieldErrors", () => {
  it("keeps one message per field, in issue order", () => {
    const result = pitchFormSchema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = toFieldErrors(result.error);
    for (const message of Object.values(errors)) {
      expect(typeof message).toBe("string");
      expect(message.length).toBeGreaterThan(0);
    }
    // A field with several failing rules still surfaces exactly one message.
    expect(Object.keys(errors)).toEqual(Array.from(new Set(Object.keys(errors))));
  });
});
