/**
 * Public entry point for the Sanity Studio schema set.
 *
 * Nothing in this directory is imported by the running site: the app talks to
 * the CMS through `src/content/adapters/sanity.ts` and never through a schema
 * definition. These modules exist so that a Studio — in this repo or beside it —
 * can be configured from the same source of truth the site is built against,
 * instead of from a schema that drifts out of step with it.
 *
 * See `./README.md` for creating the Studio, the environment variables it and
 * the site need, and how the revalidation webhook is wired.
 */

export { foundrySchemaTypes, documentSchemaTypes, SINGLETON_DOCUMENT_TYPES } from "./schemas";
export { objectSchemaTypes } from "./schemas/objects";

export {
  aboutPageSchema,
  companySchema,
  homePageSchema,
  legalPageSchema,
  networkPersonSchema,
  postSchema,
  siteSettingsSchema,
  taxonomySchema,
  teamMemberSchema,
  testimonialSchema,
} from "./schemas";

export { toSanityValidation } from "./schema-types";

export type {
  SanityArrayMember,
  SanityBuiltInType,
  SanityCustomCheck,
  SanityDocumentSchema,
  SanityField,
  SanityFieldGroup,
  SanityFieldOptions,
  SanityFieldset,
  SanityImageSchema,
  SanityInitialValue,
  SanityObjectSchema,
  SanityPreview,
  SanityPreviewValue,
  SanityReferenceTarget,
  SanityRuleLike,
  SanitySchemaType,
  SanitySelectOption,
  SanityTypeName,
  SanityValidationRule,
} from "./schema-types";

export { SANITY_QUERIES } from "./queries";
