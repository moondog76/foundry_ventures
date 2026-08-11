/**
 * Pitch form schema — the binding P0 field contract from §11.2.
 *
 * The same schema runs on the client (fast feedback) and on the server
 * (authoritative). Conditional "other" fields are enforced with refinements so
 * a client that skips validation cannot store an inconsistent record.
 */

import { z } from "zod";

export const COUNTRIES = ["Sweden", "Norway", "Finland", "Denmark", "Iceland", "Other"] as const;

export const STAGES = ["Idea", "Pre-product", "MVP", "Early revenue", "Other"] as const;

export const REFERRAL_SOURCES = [
  { value: "referral", label: "Referral" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "event", label: "Event" },
  { value: "portfolio-founder", label: "Portfolio founder" },
  { value: "search", label: "Search" },
  { value: "other", label: "Other" },
] as const;

export const MAX_FUNDING_EUR = 1_000_000_000;
export const FUNDING_STEP_EUR = 1000;

/**
 * Trimmed, non-empty string with an inclusive length window.
 *
 * Messages are written for the person filling in the form: the same strings are
 * shown inline, in the error summary, and returned by the API, so a default
 * like "Invalid input: expected string, received undefined" must never survive.
 */
const boundedText = (min: number, max: number, label: string) =>
  z
    .string({ message: `${label} is required.` })
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(
          min,
          min === 1 ? `${label} is required.` : `${label} needs to be at least ${min} characters.`,
        )
        .max(max, `${label} needs to be ${max} characters or fewer.`),
    );

const optionalUrl = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .max(2048)
      .refine(
        (value) =>
          value === "" ||
          (() => {
            try {
              const parsed = new URL(value);
              return parsed.protocol === "https:" || parsed.protocol === "http:";
            } catch {
              return false;
            }
          })(),
        { message: "Enter a valid http(s) URL." },
      ),
  )
  .transform((value) => (value === "" ? undefined : value))
  .optional();

const optionalBoundedText = (max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().max(max))
    .transform((value) => (value === "" ? undefined : value))
    .optional();

export const pitchFormSchema = z
  .object({
    country: z.enum(COUNTRIES, { message: "Select your country." }),
    countryOther: optionalBoundedText(80),

    firstName: boundedText(1, 80, "First name"),
    lastName: boundedText(1, 80, "Last name"),

    email: z
      .string({ message: "Email is required." })
      .transform((value) => value.trim().toLowerCase())
      .pipe(
        z
          .email({ message: "Enter a valid email address." })
          .max(254, "Email needs to be 254 characters or fewer."),
      ),

    companyName: boundedText(1, 120, "Company name"),
    companyWebsite: optionalUrl,

    stage: z.enum(STAGES, { message: "Select your current stage." }),
    stageOther: optionalBoundedText(80),

    // `0` is the explicit "not raised" answer — no free text is ever parsed.
    fundingRaisedEur: z
      .number({ message: "Enter an amount in euro, or 0 if you have not raised." })
      .int({ message: "Enter a whole number of euro." })
      .min(0)
      .max(MAX_FUNDING_EUR),

    oneLinePitch: boundedText(30, 400, "Your one-line pitch"),
    description: boundedText(100, 3000, "The company description"),

    deckUrl: optionalUrl,
    loomUrl: optionalUrl,

    source: z.enum(REFERRAL_SOURCES.map((s) => s.value) as [string, ...string[]]).optional(),
    sourceOther: optionalBoundedText(120),

    privacyConsent: z.literal(true, {
      message: "Please confirm you have read the privacy notice.",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.country === "Other" && !data.countryOther) {
      ctx.addIssue({
        code: "custom",
        path: ["countryOther"],
        message: "Tell us which country you are based in.",
      });
    }
    if (data.stage !== "Other" && data.stageOther) {
      // Keep the record consistent: a stale "other" value is dropped, not stored.
      data.stageOther = undefined;
    }
    if (data.stage === "Other" && !data.stageOther) {
      ctx.addIssue({
        code: "custom",
        path: ["stageOther"],
        message: "Describe your current stage.",
      });
    }
    if (data.country !== "Other" && data.countryOther) {
      data.countryOther = undefined;
    }
    if (data.source === "other" && !data.sourceOther) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceOther"],
        message: "Tell us how you heard about us.",
      });
    }
    if (data.source !== "other" && data.sourceOther) {
      data.sourceOther = undefined;
    }
  });

export type PitchFormValues = z.infer<typeof pitchFormSchema>;

/** Anti-spam fields that travel with the payload but never reach storage (§11.3). */
export const pitchAntiSpamSchema = z.object({
  /** Honeypot — must stay empty. */
  website2: z.string().max(0).optional().default(""),
  /** Client render timestamp, used to reject instant submissions. */
  renderedAt: z.coerce.number().int().nonnegative().optional(),
  /** Idempotency key, generated once per mounted form. */
  submissionId: z.string().uuid().optional(),
});

export const pitchRequestSchema = pitchFormSchema.and(pitchAntiSpamSchema);

export type PitchRequest = z.infer<typeof pitchRequestSchema>;

/** Minimum time a genuine human takes to fill the form. */
export const MIN_FORM_FILL_MS = 3000;

export type FieldErrors = Record<string, string>;

/** Flattens Zod issues into one message per field, in field order. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Human-readable labels for the error summary (§20.5). */
export const PITCH_FIELD_LABELS: Record<string, string> = {
  country: "Country",
  countryOther: "Country (other)",
  firstName: "First name",
  lastName: "Last name",
  email: "Email",
  companyName: "Company name",
  companyWebsite: "Company website",
  stage: "Current stage",
  stageOther: "Current stage (other)",
  fundingRaisedEur: "Funding raised (EUR)",
  oneLinePitch: "One-line pitch",
  description: "More about the company",
  deckUrl: "Deck URL",
  loomUrl: "Loom or video URL",
  source: "How did you hear about us?",
  sourceOther: "How did you hear about us? (other)",
  privacyConsent: "Privacy consent",
  form: "Form",
};
