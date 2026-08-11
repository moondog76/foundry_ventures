/**
 * Every reusable object type, in the order a Studio should register them.
 *
 * Order does not matter to Sanity — types are resolved by name — but reading
 * order does: evidence and source come first because almost everything else
 * embeds them.
 */

import type { SanitySchemaType } from "../../schema-types";
import { addressSchema } from "./address";
import { dataCompletenessSchema } from "./dataCompleteness";
import { editorialTextSchema } from "./editorialText";
import { fieldEvidenceSchema } from "./fieldEvidence";
import { founderSchema } from "./founder";
import { founderQuoteSchema } from "./founderQuote";
import { imageAssetSchema } from "./imageAsset";
import { investmentCriterionSchema } from "./investmentCriterion";
import { navItemSchema } from "./navItem";
import { richTextEmbedSchema, richTextQuoteSchema } from "./richText";
import { seoFieldsSchema } from "./seoFields";
import { socialLinkSchema } from "./socialLink";
import { sourceReferenceSchema } from "./sourceReference";
import { statSchema } from "./stat";

export const objectSchemaTypes: SanitySchemaType[] = [
  sourceReferenceSchema,
  fieldEvidenceSchema,
  editorialTextSchema,
  imageAssetSchema,
  seoFieldsSchema,
  richTextQuoteSchema,
  richTextEmbedSchema,
  addressSchema,
  navItemSchema,
  socialLinkSchema,
  investmentCriterionSchema,
  statSchema,
  founderSchema,
  founderQuoteSchema,
  dataCompletenessSchema,
];

export {
  addressSchema,
  dataCompletenessSchema,
  editorialTextSchema,
  fieldEvidenceSchema,
  founderQuoteSchema,
  founderSchema,
  imageAssetSchema,
  investmentCriterionSchema,
  navItemSchema,
  richTextEmbedSchema,
  richTextQuoteSchema,
  seoFieldsSchema,
  socialLinkSchema,
  sourceReferenceSchema,
  statSchema,
};
