"use client";

/**
 * Labelled control wrapper (§19.5, §20.5).
 *
 * One component owns every accessibility detail that forms usually get wrong:
 *
 *  - the label is a real, visible `<label htmlFor>`. There is deliberately no
 *    `placeholder` prop — a placeholder is not a label, it disappears the moment
 *    the user types, and it fails contrast in most browsers' default styling;
 *  - `required` is expressed twice: visually (an asterisk plus the "Required
 *    fields are marked" note the form renders) and semantically (the `required`
 *    attribute). Optional fields say "Optional" in the label so the asterisk is
 *    never the only signal;
 *  - `aria-invalid` and `aria-describedby` are wired from the same props that
 *    render the hint, the counter and the error, so they cannot disagree;
 *  - bounded textareas get a character counter that is described on focus and
 *    announced politely on a debounce — never once per keystroke.
 *
 * Deliberately *not* emitted: `maxLength`. Hard-capping a textarea silently
 * truncates a paste; the counter plus the validation message tells the user what
 * happened instead of quietly eating their words.
 */

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { cx } from "@/components/ui";
import styles from "./forms.module.css";

export type FieldOption = { value: string; label: string };

type BaseFieldProps = {
  /** Also the error-summary anchor target — keep it stable and human-readable. */
  id: string;
  name: string;
  label: ReactNode;
  required?: boolean;
  /** One message; absent means the field is currently valid. */
  error?: string;
  hint?: ReactNode;
  autoComplete?: string;
  className?: string;
};

type TextLikeProps = BaseFieldProps & {
  control: "text" | "email" | "url";
  value: string;
  onValueChange: (value: string) => void;
  inputMode?: ComponentProps<"input">["inputMode"];
  spellCheck?: boolean;
};

type NumberProps = BaseFieldProps & {
  control: "number";
  value: string;
  onValueChange: (value: string) => void;
  min: number;
  max: number;
  step: number;
};

type TextareaProps = BaseFieldProps & {
  control: "textarea";
  value: string;
  onValueChange: (value: string) => void;
  /** Counter bounds. They mirror the zod schema; they are not DOM attributes. */
  counterMin: number;
  counterMax: number;
  size?: "default" | "large";
};

type SelectProps = BaseFieldProps & {
  control: "select";
  value: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<FieldOption>;
  /** Text of the empty first option. Not a label — the `<label>` above is. */
  emptyOptionLabel: string;
};

type CheckboxProps = BaseFieldProps & {
  control: "checkbox";
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /**
   * Rendered under the control. Links belong here rather than inside the label:
   * an anchor inside a `<label>` toggles the checkbox when it is followed.
   */
  aside?: ReactNode;
};

export type FieldProps = TextLikeProps | NumberProps | TextareaProps | SelectProps | CheckboxProps;

/** Long enough that a typist is not interrupted mid-word (§20.5). */
const COUNTER_ANNOUNCE_DELAY_MS = 900;

function describeCount(length: number, min: number, max: number): string {
  if (length < min) {
    const missing = min - length;
    return `${missing} more ${missing === 1 ? "character" : "characters"} needed.`;
  }
  if (length > max) {
    const over = length - max;
    return `${over} ${over === 1 ? "character" : "characters"} over the limit.`;
  }
  const remaining = max - length;
  return `${remaining} ${remaining === 1 ? "character" : "characters"} remaining.`;
}

/**
 * Visible count is referenced by `aria-describedby`, so it is read once when
 * focus enters the field. The polite announcement lives in a separate hidden
 * status region and lags behind typing on purpose.
 */
function CharacterCounter({
  id,
  value,
  min,
  max,
}: {
  id: string;
  value: string;
  min: number;
  max: number;
}) {
  const length = value.length;
  const initialValue = useRef(value);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    // Nothing to announce until the user has actually edited the field, so a
    // freshly rendered form does not narrate its own empty textareas.
    if (value === initialValue.current) return;
    const timer = window.setTimeout(
      () => setAnnouncement(describeCount(value.length, min, max)),
      COUNTER_ANNOUNCE_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [value, min, max]);

  return (
    <>
      <span id={id} className={cx(styles.counter, length > max && styles.counterOver)}>
        {length} / {max}
        {length < min ? ` · minimum ${min}` : null}
      </span>
      <span className="visually-hidden" role="status">
        {announcement}
      </span>
    </>
  );
}

export function Field(props: FieldProps) {
  const { id, name, label, required = false, error, hint, autoComplete, className } = props;

  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;
  const counterId = props.control === "textarea" ? `${id}-count` : null;

  // Order matters: context first, then the live count, then the problem.
  const describedBy = [hintId, counterId, errorId].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(error);

  const labelContent = (
    <>
      {label}
      {required ? (
        <span className={styles.requiredMark} aria-hidden="true">
          *
        </span>
      ) : (
        <span className={styles.optionalMark}>(optional)</span>
      )}
    </>
  );

  const messages = (
    <>
      {hint ? (
        <span id={hintId ?? undefined} className={styles.hint}>
          {hint}
        </span>
      ) : null}
      {props.control === "textarea" && counterId ? (
        <CharacterCounter
          id={counterId}
          value={props.value}
          min={props.counterMin}
          max={props.counterMax}
        />
      ) : null}
      {error ? (
        <span id={errorId ?? undefined} className={styles.error}>
          <span className={styles.errorMarker} aria-hidden="true">
            ✕
          </span>
          {error}
        </span>
      ) : null}
    </>
  );

  if (props.control === "checkbox") {
    return (
      <div className={cx(styles.checkboxField, className)}>
        <label className={styles.checkboxLabel} htmlFor={id}>
          <input
            id={id}
            name={name}
            type="checkbox"
            className={styles.checkbox}
            checked={props.checked}
            onChange={(event) => props.onCheckedChange(event.target.checked)}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
          />
          <span>{labelContent}</span>
        </label>
        {props.aside ? <p className={styles.checkboxAside}>{props.aside}</p> : null}
        {messages}
      </div>
    );
  }

  const controlClassName = cx(styles.control, invalid && styles.controlInvalid);

  let control: ReactNode;
  switch (props.control) {
    case "textarea":
      control = (
        <textarea
          id={id}
          name={name}
          className={cx(
            controlClassName,
            styles.textarea,
            props.size === "large" && styles.textareaLarge,
          )}
          value={props.value}
          onChange={(event) => props.onValueChange(event.target.value)}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        />
      );
      break;

    case "select":
      control = (
        <span className={styles.selectWrap}>
          <select
            id={id}
            name={name}
            className={cx(controlClassName, styles.select)}
            value={props.value}
            onChange={(event) => props.onValueChange(event.target.value)}
            required={required}
            autoComplete={autoComplete}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
          >
            <option value="">{props.emptyOptionLabel}</option>
            {props.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </span>
      );
      break;

    case "number":
      control = (
        <input
          id={id}
          name={name}
          type="number"
          className={cx(controlClassName, styles.number)}
          value={props.value}
          onChange={(event) => props.onValueChange(event.target.value)}
          min={props.min}
          max={props.max}
          step={props.step}
          inputMode="numeric"
          required={required}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        />
      );
      break;

    default:
      control = (
        <input
          id={id}
          name={name}
          type={props.control}
          className={controlClassName}
          value={props.value}
          onChange={(event) => props.onValueChange(event.target.value)}
          inputMode={props.inputMode}
          spellCheck={props.spellCheck}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        />
      );
      break;
  }

  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.label} htmlFor={id}>
        {labelContent}
      </label>
      {control}
      {messages}
    </div>
  );
}
