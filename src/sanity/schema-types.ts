/**
 * A minimal, local model of the Sanity schema-definition shape.
 *
 * ## Why this file exists
 *
 * The `sanity` package is deliberately **not** a dependency of this app. The
 * site has to build, typecheck and be reviewed with no CMS credentials and no
 * Studio toolchain (§4.2, §30) — `src/content/index.ts` falls back to the local
 * seed adapter whenever `SANITY_PROJECT_ID` / `SANITY_DATASET` are absent. If
 * these schema files imported `defineType` / `defineField` / `Rule` from
 * `sanity`, the whole content layer would inherit a Studio-only dependency, and
 * faking an import from a package that is not installed is not an option.
 *
 * So every schema in `./schemas` is a **plain object literal** typed against the
 * subset of Sanity's schema shape it actually uses. They are pure data with no
 * runtime behaviour, which means they can be dropped straight into a Studio's
 * `schema.types` array without a translation step.
 *
 * ## Wiring the exports into a Studio
 *
 * ```ts
 * // studio/sanity.config.ts
 * import { defineConfig, type SchemaTypeDefinition } from "sanity";
 * import { deskTool } from "sanity/desk";
 * import { foundrySchemaTypes } from "../src/sanity";
 *
 * export default defineConfig({
 *   projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
 *   dataset: process.env.SANITY_STUDIO_DATASET!,
 *   plugins: [deskTool()],
 *   schema: { types: foundrySchemaTypes as SchemaTypeDefinition[] },
 * });
 * ```
 *
 * The cast is expected: these literals are a structural *subset* of Sanity's own
 * `SchemaTypeDefinition` union, not a re-declaration of it, and Sanity's types
 * are a discriminated union that will not infer from a widened `type: string`.
 * The cast is safe precisely because the shape is a subset — every key used here
 * exists on the corresponding Sanity definition with the same meaning.
 *
 * ## Validation
 *
 * Sanity's `validation` takes a `Rule` callback, and `Rule` lives in the package
 * we are not importing. Constraints are therefore carried as **data** on an
 * optional `validationRule` field, and `toSanityValidation` (bottom of this
 * file) turns that data into the callback Sanity wants — using only structural
 * typing, so it never names a Sanity type. See its doc comment for the one line
 * of Studio-side glue it needs.
 */

/* -------------------------------------------------------------- Type names */

/** The built-in Sanity types this schema set uses. */
export type SanityBuiltInType =
  | "array"
  | "block"
  | "boolean"
  | "date"
  | "datetime"
  | "document"
  | "image"
  | "number"
  | "object"
  | "reference"
  | "slug"
  | "string"
  | "text"
  | "url";

/**
 * A built-in type, or the `name` of one of the object types defined in
 * `./schemas/objects`. The intersection keeps editor autocomplete for the
 * built-ins while still accepting a custom type name.
 */
export type SanityTypeName = SanityBuiltInType | (string & Record<never, never>);

/* -------------------------------------------------------------- Validation */

/**
 * A cross-field or otherwise non-declarative constraint, expressed as a real
 * predicate so the Studio enforces it instead of merely documenting it.
 *
 * `value` is the field value for a field-level rule and the whole document for
 * a document-level rule; `context.document` is always the whole document.
 * Return `true` when valid, or the message to show the editor.
 */
export type SanityCustomCheck = (
  value: unknown,
  context: { document?: Record<string, unknown> },
) => true | string;

/**
 * A machine-readable description of a field constraint.
 *
 * Everything except `custom` is declarative and is applied mechanically by
 * `toSanityValidation`. `custom` is prose for the editor and the content-gaps
 * report; supply `customCheck` alongside it when the rule should actually be
 * enforced in the Studio.
 */
export type SanityValidationRule = {
  /** Field must have a value before the document can be published. */
  required?: boolean;
  /** Minimum string length, number value, or array length. */
  min?: number;
  /** Maximum string length, number value, or array length. */
  max?: number;
  /** Number must be a whole number. */
  integer?: boolean;
  /** Array entries must be unique. */
  unique?: boolean;
  /** URL constraint. `allowRelative` defaults to false — absolute URLs only. */
  uri?: { scheme: string[]; allowRelative?: boolean };
  /**
   * Pattern constraint. Held as a source string rather than a `RegExp` so the
   * rule stays serialisable and can be printed in editor-facing documentation.
   */
  regex?: { pattern: string; flags?: string; name: string };
  /** Human-readable statement of a constraint `toSanityValidation` cannot infer. */
  custom?: string;
  /** Executable form of `custom`. Without it the constraint is documentation only. */
  customCheck?: SanityCustomCheck;
};

/* ----------------------------------------------------------------- Options */

export type SanitySelectOption = { title: string; value: string };

export type SanityFieldOptions = {
  /** Fixed choice list. Always paired with a `layout` so the control is explicit. */
  list?: SanitySelectOption[];
  layout?: "radio" | "dropdown" | "tags" | "grid";
  direction?: "horizontal" | "vertical";
  /** Field name a slug is generated from. */
  source?: string;
  maxLength?: number;
  /** Enables the image hotspot/crop editor. */
  hotspot?: boolean;
  /** Shows the field in the compact asset form rather than behind "Edit". */
  isHighlighted?: boolean;
  sortable?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  columns?: number;
  /** Forbids creating a new referenced document from inside this field. */
  disableNew?: boolean;
  /** GROQ filter narrowing which documents a reference may point at. */
  filter?: string;
  dateFormat?: string;
};

/* ----------------------------------------------------------------- Preview */

export type SanityPreviewValue = {
  title: string;
  subtitle?: string;
  description?: string;
  media?: unknown;
};

/**
 * Studio list rendering. `select` maps a selection key to a dotted field path;
 * `prepare` turns that selection into the row.
 */
export type SanityPreview = {
  select: Record<string, string>;
  prepare?: (selection: Record<string, unknown>) => SanityPreviewValue;
};

/* ------------------------------------------------------------ Portable Text */

/** Block-type-only configuration (`{ type: "block" }` array members). */
export type SanityBlockStyle = { title: string; value: string };

export type SanityBlockMarks = {
  decorators?: SanityBlockStyle[];
  /** Annotation objects, e.g. the link mark. */
  annotations?: SanityArrayMember[];
};

/* ------------------------------------------------------------------ Fields */

export type SanityInitialValue =
  string | number | boolean | null | SanityInitialValue[] | { [key: string]: SanityInitialValue };

export type SanityReferenceTarget = { type: SanityTypeName };

export type SanityField = {
  name: string;
  title: string;
  type: SanityTypeName;
  /**
   * Required by the build contract: every field carries guidance written for a
   * non-technical content owner, saying what the field is for and when it may
   * be filled in. A field with no explanation is a field that gets guessed at.
   */
  description: string;
  /** Nested fields, for inline `object` fields. */
  fields?: SanityField[];
  /** Member types, for `array` fields. */
  of?: SanityArrayMember[];
  /** Allowed targets, for `reference` fields. */
  to?: SanityReferenceTarget[];
  options?: SanityFieldOptions;
  initialValue?: SanityInitialValue;
  validationRule?: SanityValidationRule;
  preview?: SanityPreview;
  fieldset?: string;
  group?: string | string[];
  hidden?: boolean;
  readOnly?: boolean;
};

/** An `array` member. Same shape as a field, but unnamed members are allowed. */
export type SanityArrayMember = {
  type: SanityTypeName;
  name?: string;
  title?: string;
  description?: string;
  fields?: SanityField[];
  of?: SanityArrayMember[];
  to?: SanityReferenceTarget[];
  options?: SanityFieldOptions;
  initialValue?: SanityInitialValue;
  validationRule?: SanityValidationRule;
  preview?: SanityPreview;
  /** `block` members only — the paragraph styles an editor may choose. */
  styles?: SanityBlockStyle[];
  /** `block` members only — the list styles an editor may choose. */
  lists?: SanityBlockStyle[];
  /** `block` members only — inline decorators and annotations. */
  marks?: SanityBlockMarks;
};

/* ------------------------------------------------------------ Schema types */

export type SanityFieldset = {
  name: string;
  title: string;
  description?: string;
  options?: { collapsible?: boolean; collapsed?: boolean; columns?: number };
};

export type SanityFieldGroup = {
  name: string;
  title: string;
  default?: boolean;
};

export type SanitySchemaType = {
  name: string;
  title: string;
  type: SanityTypeName;
  description?: string;
  fields?: SanityField[];
  of?: SanityArrayMember[];
  options?: SanityFieldOptions;
  preview?: SanityPreview;
  fieldsets?: SanityFieldset[];
  groups?: SanityFieldGroup[];
  initialValue?: SanityInitialValue;
  validationRule?: SanityValidationRule;
  hidden?: boolean;
  readOnly?: boolean;
};

/**
 * A top-level document. `preview` is required rather than optional on purpose:
 * a Studio list that reads "Untitled" for every row is how unpublishable records
 * go unnoticed, so the type system insists on one.
 */
export type SanityDocumentSchema = SanitySchemaType & {
  type: "document";
  fields: SanityField[];
  preview: SanityPreview;
};

export type SanityObjectSchema = SanitySchemaType & {
  type: "object";
  fields: SanityField[];
};

/** An object type that extends the built-in `image` type with extra fields. */
export type SanityImageSchema = SanitySchemaType & {
  type: "image";
  fields: SanityField[];
};

/* --------------------------------------------------- Validation conversion */

/**
 * The slice of Sanity's `Rule` API `toSanityValidation` drives.
 *
 * It is written with a self type parameter because every `Rule` method returns
 * `Rule`: the Studio passes its own `Rule` in and gets its own `Rule` back, and
 * no Sanity type is ever named here.
 */
export type SanityRuleLike<Self> = {
  required(): Self;
  min(value: number): Self;
  max(value: number): Self;
  integer(): Self;
  unique(): Self;
  uri(options: { scheme: string[]; allowRelative: boolean }): Self;
  regex(pattern: RegExp, options: { name: string }): Self;
  custom(check: SanityCustomCheck): Self;
};

/**
 * Turns a `validationRule` into the `validation` callback Sanity expects.
 *
 * Studio side, walk the schema once and attach it — no per-field wiring:
 *
 * ```ts
 * import { type Rule } from "sanity";
 * import { toSanityValidation } from "../src/sanity/schema-types";
 *
 * function withValidation<T extends { validationRule?: SanityValidationRule }>(node: T) {
 *   return node.validationRule
 *     ? { ...node, validation: (rule: Rule) => toSanityValidation(node.validationRule)(rule) }
 *     : node;
 * }
 * ```
 *
 * A rule that carries only a prose `custom` and no `customCheck` produces no
 * runtime constraint — that is deliberate. It means "a human has to check this",
 * and inventing a predicate for it would be worse than saying so.
 */
export function toSanityValidation<Self extends SanityRuleLike<Self>>(
  rule: SanityValidationRule | undefined,
): (base: Self) => Self {
  return (base: Self): Self => {
    if (!rule) return base;
    let next = base;
    if (rule.required) next = next.required();
    if (rule.min !== undefined) next = next.min(rule.min);
    if (rule.max !== undefined) next = next.max(rule.max);
    if (rule.integer) next = next.integer();
    if (rule.unique) next = next.unique();
    if (rule.uri) {
      next = next.uri({
        scheme: rule.uri.scheme,
        // Default to absolute-only: a relative URL in a CMS field is almost
        // always a mistake in this codebase, since internal routes are literals.
        allowRelative: rule.uri.allowRelative ?? false,
      });
    }
    if (rule.regex) {
      next = next.regex(new RegExp(rule.regex.pattern, rule.regex.flags), {
        name: rule.regex.name,
      });
    }
    if (rule.customCheck) next = next.custom(rule.customCheck);
    return next;
  };
}
