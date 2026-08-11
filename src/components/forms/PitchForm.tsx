"use client";

/**
 * The pitch form (§11.2, §19.5, §20.5, §28.5).
 *
 * The field contract is not restated here — it lives in `pitchFormSchema`, and
 * the exact same schema runs on the client for fast feedback and on the server,
 * where it is authoritative. If the two ever disagree the server wins and the
 * user still sees per-field messages, because the server returns errors keyed by
 * the same field names this component renders.
 *
 * Things that are easy to get wrong and are deliberate here:
 *
 *  - the submit button is never unmounted and never gets the native `disabled`
 *    attribute. A disabled control is blurred by the browser, which throws a
 *    keyboard user back to `<body>` mid-submission; `aria-disabled` plus a guard
 *    in the handler gives the same protection without stealing their place;
 *  - a temporary failure never clears the form. Every value stays exactly where
 *    the founder left it so "try again" is one click, not a rewrite;
 *  - nothing the user typed is ever sent to analytics. The event union in
 *    `@/lib/analytics` has no free-text slot on purpose; only a coarse failure
 *    category travels;
 *  - the request is always a JSON POST. A GET would put the pitch, the deck URL
 *    and the founder's email into the query string, and from there into server
 *    logs, browser history and any referrer.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  COUNTRIES,
  FUNDING_STEP_EUR,
  MAX_FUNDING_EUR,
  MIN_FORM_FILL_MS,
  PITCH_FIELD_LABELS,
  REFERRAL_SOURCES,
  STAGES,
  pitchFormSchema,
  toFieldErrors,
  type FieldErrors,
} from "@/lib/validation/pitch";
import { track } from "@/lib/analytics";
import { TextLink, cx, uiStyles } from "@/components/ui";
import { Field } from "./Field";
import { FormErrorSummary, type FormErrorSummaryItem } from "./FormErrorSummary";
import { FormSuccess } from "./FormSuccess";
import { PITCH_ENDPOINT, type PitchApiResponse } from "./pitch-api";
import styles from "./forms.module.css";

/* ------------------------------------------------------------------ State */

type PitchFormState = {
  country: string;
  countryOther: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  companyWebsite: string;
  stage: string;
  stageOther: string;
  /** Kept as the raw input string; parsed to a number only at submit time. */
  fundingRaisedEur: string;
  oneLinePitch: string;
  description: string;
  deckUrl: string;
  loomUrl: string;
  source: string;
  sourceOther: string;
  privacyConsent: boolean;
};

const EMPTY_VALUES: PitchFormState = {
  country: "",
  countryOther: "",
  firstName: "",
  lastName: "",
  email: "",
  companyName: "",
  companyWebsite: "",
  stage: "",
  stageOther: "",
  fundingRaisedEur: "",
  oneLinePitch: "",
  description: "",
  deckUrl: "",
  loomUrl: "",
  source: "",
  sourceOther: "",
  privacyConsent: false,
};

/**
 * Visual order of the form. The error summary is sorted by this rather than by
 * the order the issues happen to arrive in, so "first error" always means the
 * one nearest the top of the page.
 */
const FIELD_ORDER: ReadonlyArray<keyof PitchFormState> = [
  "country",
  "countryOther",
  "firstName",
  "lastName",
  "email",
  "companyName",
  "companyWebsite",
  "stage",
  "stageOther",
  "fundingRaisedEur",
  "oneLinePitch",
  "description",
  "deckUrl",
  "loomUrl",
  "source",
  "sourceOther",
  "privacyConsent",
];

/* -------------------------------------------------------------- Constants */

const ONE_LINE_MIN = 30;
const ONE_LINE_MAX = 400;
const DESCRIPTION_MIN = 100;
const DESCRIPTION_MAX = 3000;

/** A hung request must not leave the button busy forever. */
const REQUEST_TIMEOUT_MS = 30_000;

const NETWORK_ERROR_MESSAGE =
  "We could not reach the server. Nothing was sent, and everything you typed is still here — check your connection and try again.";
const UNEXPECTED_ERROR_MESSAGE =
  "Something went wrong on our side. Nothing was lost — please try again.";
const RATE_LIMIT_FALLBACK_MESSAGE =
  "Too many submissions from this connection. Please wait a while and try again.";

const ids = {
  form: "pitch-form",
  summary: "pitch-error-summary",
  summaryHeading: "pitch-error-summary-heading",
  successHeading: "pitch-success-heading",
} as const;

/** Stable, readable DOM ids so the summary anchors are `#pitch-email`, not noise. */
function fieldId(name: keyof PitchFormState | string): string {
  return `pitch-${name}`;
}

const COUNTRY_OPTIONS = COUNTRIES.map((country) => ({ value: country, label: country }));
const STAGE_OPTIONS = STAGES.map((stage) => ({ value: stage, label: stage }));
const SOURCE_OPTIONS = REFERRAL_SOURCES.map((source) => ({
  value: source.value,
  label: source.label,
}));

/* ------------------------------------------------------------- Identity */

type FormIdentity = { renderedAt: number; submissionId: string | undefined };

/**
 * `crypto.randomUUID()` only exists in a secure context. Where it is missing we
 * build a v4 UUID from the CSPRNG that is available, and where even that is
 * missing we send no id at all — the schema allows it and the server mints one.
 * The only thing lost in that last case is client-side idempotency.
 */
function createSubmissionId(): string | undefined {
  const api = typeof globalThis.crypto === "undefined" ? undefined : globalThis.crypto;
  if (typeof api?.randomUUID === "function") return api.randomUUID();
  if (typeof api?.getRandomValues !== "function") return undefined;

  const bytes = new Uint8Array(16);
  api.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/* ---------------------------------------------------------------- Helpers */

/**
 * `<input type="number">` hands back "" for anything it considers unparseable,
 * so the only two cases are empty (the answer is missing) and numeric. Empty
 * becomes `undefined` so zod reports the missing-value message rather than
 * silently treating a blank as zero — "we have not raised" is an explicit 0.
 */
function parseFundingInput(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === "") return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : Number.NaN;
}

function toSchemaInput(values: PitchFormState) {
  return {
    country: values.country,
    countryOther: values.countryOther,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    companyName: values.companyName,
    companyWebsite: values.companyWebsite,
    stage: values.stage,
    stageOther: values.stageOther,
    fundingRaisedEur: parseFundingInput(values.fundingRaisedEur),
    oneLinePitch: values.oneLinePitch,
    description: values.description,
    deckUrl: values.deckUrl,
    loomUrl: values.loomUrl,
    // An unanswered optional select is absent, not an empty enum member.
    source: values.source === "" ? undefined : values.source,
    sourceOther: values.sourceOther,
    privacyConsent: values.privacyConsent,
  };
}

type FailureCategory = "validation" | "rate-limit" | "server" | "network";

/* ------------------------------------------------------------- Component */

export function PitchForm() {
  const [values, setValues] = useState<PitchFormState>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [submissionReference, setSubmissionReference] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  /** Bumped on every failed attempt so the summary re-takes focus each time. */
  const [focusToken, setFocusToken] = useState(0);
  const [honeypot, setHoneypot] = useState("");
  const [appearanceMessage, setAppearanceMessage] = useState("");

  const identityRef = useRef<FormIdentity | null>(null);
  const startedRef = useRef(false);
  // Mirrors `pending` for the submit guard: state is one render behind a fast
  // double activation (Enter held down, or a double tap), a ref is not.
  const inFlightRef = useRef(false);

  useEffect(() => {
    // Captured on mount, not on first render: the server render has no clock
    // the client should trust, and the anti-spam window starts when the founder
    // actually sees the form.
    if (identityRef.current) return;
    identityRef.current = { renderedAt: Date.now(), submissionId: createSubmissionId() };
  }, []);

  const ensureIdentity = useCallback((): FormIdentity => {
    if (!identityRef.current) {
      identityRef.current = { renderedAt: Date.now(), submissionId: createSubmissionId() };
    }
    return identityRef.current;
  }, []);

  const setValue = useCallback(
    <Key extends keyof PitchFormState>(key: Key, value: PitchFormState[Key]) => {
      setValues((current) => ({ ...current, [key]: value }));
      // Clear this field's error as soon as it is edited: leaving a stale message
      // under a field the user has already fixed is actively misleading.
      setFieldErrors((current) => {
        if (!(key in current)) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const noteInteraction = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    // No field value, ever — the event has no payload slot for one.
    track({ name: "pitch_start" });
  }, []);

  /* --------------------------------------------- Conditional field a11y */

  const showCountryOther = values.country === "Other";
  const showStageOther = values.stage === "Other";
  const showSourceOther = values.source === "other";

  const conditionalLabels = useMemo(() => {
    const labels: string[] = [];
    if (showCountryOther) labels.push(PITCH_FIELD_LABELS.countryOther);
    if (showStageOther) labels.push(PITCH_FIELD_LABELS.stageOther);
    if (showSourceOther) labels.push(PITCH_FIELD_LABELS.sourceOther);
    return labels;
  }, [showCountryOther, showStageOther, showSourceOther]);

  const previousConditionalRef = useRef<string[]>([]);
  useEffect(() => {
    const added = conditionalLabels.filter(
      (label) => !previousConditionalRef.current.includes(label),
    );
    previousConditionalRef.current = conditionalLabels;
    if (added.length === 0) return;
    // A field that appears out of nowhere is silent to a screen reader unless
    // something says so. The live region below is present from first render.
    setAppearanceMessage(`An extra question has been added: ${added.join(", ")}.`);
  }, [conditionalLabels]);

  /* ------------------------------------------------------------ Submit */

  const applyFailure = useCallback(
    (failure: { errors?: FieldErrors; message: string | null; category: FailureCategory }) => {
      setFieldErrors(failure.errors ?? {});
      setFormMessage(failure.message);
      setFocusToken((token) => token + 1);
      track({ name: "pitch_submit_error", category: failure.category });
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (inFlightRef.current) return;

      const parsed = pitchFormSchema.safeParse(toSchemaInput(values));
      if (!parsed.success) {
        applyFailure({
          errors: toFieldErrors(parsed.error),
          message: null,
          category: "validation",
        });
        return;
      }

      inFlightRef.current = true;
      setPending(true);
      setFieldErrors({});
      setFormMessage(null);

      try {
        const identity = ensureIdentity();

        // The server rejects anything submitted faster than a human could read
        // the form. Autofill can genuinely beat that clock, so we hold the
        // request back rather than let a real founder be told they are a bot.
        const elapsed = Date.now() - identity.renderedAt;
        if (elapsed < MIN_FORM_FILL_MS) {
          await new Promise((resolve) => window.setTimeout(resolve, MIN_FORM_FILL_MS - elapsed));
        }

        const response = await fetch(PITCH_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...parsed.data,
            website2: honeypot,
            renderedAt: identity.renderedAt,
            submissionId: identity.submissionId,
          }),
          // Same-origin by construction; never let a redirect carry the body on.
          redirect: "error",
          signal:
            typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
              ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
              : undefined,
        });

        const body = (await response.json().catch(() => null)) as PitchApiResponse | null;

        if (response.ok) {
          // Any 2xx means the pitch is stored. If the body somehow failed to
          // parse we still confirm — telling a founder to resend something that
          // was already saved is the worse of the two mistakes.
          setSubmissionReference(body?.ok ? body.submissionId : null);
          setSucceeded(true);
          track({ name: "pitch_submit_success" });
          return;
        }

        if (response.status === 429) {
          applyFailure({
            message:
              body && !body.ok && body.kind === "rate-limit"
                ? body.message
                : RATE_LIMIT_FALLBACK_MESSAGE,
            category: "rate-limit",
          });
          return;
        }

        if (response.status >= 500) {
          applyFailure({
            message:
              body && !body.ok && body.kind === "server" ? body.message : UNEXPECTED_ERROR_MESSAGE,
            category: "server",
          });
          return;
        }

        if (body && !body.ok && body.kind === "validation") {
          applyFailure({ errors: body.errors, message: null, category: "validation" });
          return;
        }

        // Any other 4xx: the request was refused and the reason is deliberately
        // generic. It is still a client-side rejection, so it is categorised
        // with the other 4xx outcomes rather than reported as a server fault.
        applyFailure({
          message: body && !body.ok && "message" in body ? body.message : UNEXPECTED_ERROR_MESSAGE,
          category: "validation",
        });
      } catch {
        // Aborts, offline, DNS, CSP — indistinguishable from here, and all of
        // them mean the same thing to the user: it did not go out, try again.
        applyFailure({ message: NETWORK_ERROR_MESSAGE, category: "network" });
      } finally {
        inFlightRef.current = false;
        setPending(false);
      }
    },
    [applyFailure, ensureIdentity, honeypot, values],
  );

  /* ---------------------------------------------------------- Summary */

  const summaryItems = useMemo<FormErrorSummaryItem[]>(() => {
    const items: FormErrorSummaryItem[] = [];
    if (formMessage) {
      items.push({ field: "form", message: formMessage, targetId: null });
    }
    const known = new Set<string>(FIELD_ORDER);
    for (const key of FIELD_ORDER) {
      const message = fieldErrors[key];
      if (!message) continue;
      items.push({
        field: key,
        label: PITCH_FIELD_LABELS[key] ?? key,
        message,
        targetId: fieldId(key),
      });
    }
    // Defensive: a key the server knows about but this form does not render
    // still has to reach the user, just without a link to jump to.
    for (const [key, message] of Object.entries(fieldErrors)) {
      if (known.has(key)) continue;
      items.push({ field: key, label: PITCH_FIELD_LABELS[key], message, targetId: null });
    }
    return items;
  }, [fieldErrors, formMessage]);

  const fieldErrorCount = summaryItems.filter((item) => item.targetId !== null).length;
  const summaryHeading =
    fieldErrorCount > 0
      ? `There ${fieldErrorCount === 1 ? "is" : "are"} ${fieldErrorCount} ${
          fieldErrorCount === 1 ? "problem" : "problems"
        } with your pitch`
      : "We could not send your pitch";

  /* ----------------------------------------------------------- Render */

  if (succeeded) {
    return (
      <FormSuccess
        headingId={ids.successHeading}
        title="Thank you — your pitch is with us"
        reference={submissionReference}
      >
        <p>
          Your submission has been stored and the Foundry team has been notified. Anything we come
          back with arrives by email, at the address you gave us.
        </p>
      </FormSuccess>
    );
  }

  return (
    <form
      id={ids.form}
      className={styles.form}
      // Our own messages are more specific than the browser's bubbles, and the
      // summary above is what carries focus. Native validation would pre-empt both.
      noValidate
      onSubmit={handleSubmit}
      onFocusCapture={noteInteraction}
      onChangeCapture={noteInteraction}
    >
      {summaryItems.length > 0 ? (
        <FormErrorSummary
          id={ids.summary}
          headingId={ids.summaryHeading}
          heading={summaryHeading}
          items={summaryItems}
          focusToken={focusToken}
        />
      ) : null}

      <p className={styles.requiredNote}>Required fields are marked with an asterisk (*).</p>

      {/* Present from the first render so an insertion is actually announced. */}
      <p className="visually-hidden" aria-live="polite">
        {appearanceMessage}
      </p>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>About you</legend>
        <div className={styles.fieldsetBody}>
          <Field
            control="select"
            id={fieldId("country")}
            name="country"
            label={PITCH_FIELD_LABELS.country}
            required
            autoComplete="country-name"
            value={values.country}
            onValueChange={(value) => setValue("country", value)}
            options={COUNTRY_OPTIONS}
            emptyOptionLabel="Select a country"
            error={fieldErrors.country}
          />

          {showCountryOther ? (
            <Field
              control="text"
              id={fieldId("countryOther")}
              name="countryOther"
              label={PITCH_FIELD_LABELS.countryOther}
              required
              value={values.countryOther}
              onValueChange={(value) => setValue("countryOther", value)}
              hint="Where are you based?"
              error={fieldErrors.countryOther}
            />
          ) : null}

          <div className={cx(styles.row, styles.rowTwo)}>
            <Field
              control="text"
              id={fieldId("firstName")}
              name="firstName"
              label={PITCH_FIELD_LABELS.firstName}
              required
              autoComplete="given-name"
              value={values.firstName}
              onValueChange={(value) => setValue("firstName", value)}
              error={fieldErrors.firstName}
            />
            <Field
              control="text"
              id={fieldId("lastName")}
              name="lastName"
              label={PITCH_FIELD_LABELS.lastName}
              required
              autoComplete="family-name"
              value={values.lastName}
              onValueChange={(value) => setValue("lastName", value)}
              error={fieldErrors.lastName}
            />
          </div>

          <Field
            control="email"
            id={fieldId("email")}
            name="email"
            label={PITCH_FIELD_LABELS.email}
            required
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            value={values.email}
            onValueChange={(value) => setValue("email", value)}
            hint="Any reply goes to this address."
            error={fieldErrors.email}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>About the company</legend>
        <div className={styles.fieldsetBody}>
          <Field
            control="text"
            id={fieldId("companyName")}
            name="companyName"
            label={PITCH_FIELD_LABELS.companyName}
            required
            autoComplete="organization"
            value={values.companyName}
            onValueChange={(value) => setValue("companyName", value)}
            hint="A working name is fine."
            error={fieldErrors.companyName}
          />

          <Field
            control="url"
            id={fieldId("companyWebsite")}
            name="companyWebsite"
            label={PITCH_FIELD_LABELS.companyWebsite}
            autoComplete="url"
            inputMode="url"
            spellCheck={false}
            value={values.companyWebsite}
            onValueChange={(value) => setValue("companyWebsite", value)}
            hint="Include https://"
            error={fieldErrors.companyWebsite}
          />

          <Field
            control="select"
            id={fieldId("stage")}
            name="stage"
            label={PITCH_FIELD_LABELS.stage}
            required
            value={values.stage}
            onValueChange={(value) => setValue("stage", value)}
            options={STAGE_OPTIONS}
            emptyOptionLabel="Select a stage"
            error={fieldErrors.stage}
          />

          {showStageOther ? (
            <Field
              control="text"
              id={fieldId("stageOther")}
              name="stageOther"
              label={PITCH_FIELD_LABELS.stageOther}
              required
              value={values.stageOther}
              onValueChange={(value) => setValue("stageOther", value)}
              hint="Describe where you are today."
              error={fieldErrors.stageOther}
            />
          ) : null}

          <Field
            control="number"
            id={fieldId("fundingRaisedEur")}
            name="fundingRaisedEur"
            label={PITCH_FIELD_LABELS.fundingRaisedEur}
            required
            value={values.fundingRaisedEur}
            onValueChange={(value) => setValue("fundingRaisedEur", value)}
            min={0}
            max={MAX_FUNDING_EUR}
            step={FUNDING_STEP_EUR}
            hint="Total raised so far, in euro. Enter 0 if you have not raised."
            error={fieldErrors.fundingRaisedEur}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Your pitch</legend>
        <div className={styles.fieldsetBody}>
          <Field
            control="textarea"
            id={fieldId("oneLinePitch")}
            name="oneLinePitch"
            label={PITCH_FIELD_LABELS.oneLinePitch}
            required
            value={values.oneLinePitch}
            onValueChange={(value) => setValue("oneLinePitch", value)}
            counterMin={ONE_LINE_MIN}
            counterMax={ONE_LINE_MAX}
            hint="One sentence a stranger would understand."
            error={fieldErrors.oneLinePitch}
          />

          <Field
            control="textarea"
            id={fieldId("description")}
            name="description"
            label={PITCH_FIELD_LABELS.description}
            required
            size="large"
            value={values.description}
            onValueChange={(value) => setValue("description", value)}
            counterMin={DESCRIPTION_MIN}
            counterMax={DESCRIPTION_MAX}
            hint="What you are building, who it is for, and where you are today."
            error={fieldErrors.description}
          />

          <Field
            control="url"
            id={fieldId("deckUrl")}
            name="deckUrl"
            label={PITCH_FIELD_LABELS.deckUrl}
            autoComplete="off"
            inputMode="url"
            spellCheck={false}
            value={values.deckUrl}
            onValueChange={(value) => setValue("deckUrl", value)}
            hint="A link we can open."
            error={fieldErrors.deckUrl}
          />

          <Field
            control="url"
            id={fieldId("loomUrl")}
            name="loomUrl"
            label={PITCH_FIELD_LABELS.loomUrl}
            autoComplete="off"
            inputMode="url"
            spellCheck={false}
            value={values.loomUrl}
            onValueChange={(value) => setValue("loomUrl", value)}
            hint="A short walkthrough, if you have one."
            error={fieldErrors.loomUrl}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Before you send</legend>
        <div className={styles.fieldsetBody}>
          <Field
            control="select"
            id={fieldId("source")}
            name="source"
            label={PITCH_FIELD_LABELS.source}
            value={values.source}
            onValueChange={(value) => setValue("source", value)}
            options={SOURCE_OPTIONS}
            emptyOptionLabel="Select an option"
            error={fieldErrors.source}
          />

          {showSourceOther ? (
            <Field
              control="text"
              id={fieldId("sourceOther")}
              name="sourceOther"
              label={PITCH_FIELD_LABELS.sourceOther}
              required
              value={values.sourceOther}
              onValueChange={(value) => setValue("sourceOther", value)}
              error={fieldErrors.sourceOther}
            />
          ) : null}

          <Field
            control="checkbox"
            id={fieldId("privacyConsent")}
            name="privacyConsent"
            label="I have read the privacy notice and consent to Foundry storing this submission."
            required
            checked={values.privacyConsent}
            onCheckedChange={(checked) => setValue("privacyConsent", checked)}
            error={fieldErrors.privacyConsent}
            aside={<TextLink href="/privacy">Read the privacy notice</TextLink>}
          />
        </div>
      </fieldset>

      {/*
        Honeypot (§11.3). Off-screen rather than hidden, kept out of the tab
        order, and never autofilled — a human will not see it, a bot will fill it.
      */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor={fieldId("website2")}>Website</label>
        <input
          id={fieldId("website2")}
          name="website2"
          type="text"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          className={cx(uiStyles.button, styles.submit)}
          /*
           * `aria-disabled` rather than `disabled`: the native attribute makes
           * the browser blur the button, and a keyboard user would lose their
           * place at exactly the moment they need feedback. The handler's
           * in-flight guard is what actually blocks the second submit.
           */
          aria-disabled={pending || undefined}
          aria-busy={pending || undefined}
        >
          Send pitch
        </button>
        <p className={styles.pendingStatus} role="status">
          {pending ? "Sending your pitch…" : ""}
        </p>
      </div>
    </form>
  );
}
