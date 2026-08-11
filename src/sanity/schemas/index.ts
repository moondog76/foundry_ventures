/**
 * Every document type, plus the combined array a Studio registers.
 *
 * The document names here are load-bearing in two places outside the Studio:
 *
 *  - the `_type` filters in `SANITY_QUERIES` (`src/content/adapters/sanity.ts`);
 *  - the `documentType` switch in the revalidation webhook
 *    (`src/app/api/revalidate/route.ts`), which decides which pages to rebuild
 *    when a document changes.
 *
 * Renaming a document type therefore breaks content fetching and cache
 * invalidation silently — the webhook answers 200 and revalidates nothing.
 */

import type { SanityDocumentSchema, SanitySchemaType } from "../schema-types";
import { objectSchemaTypes } from "./objects";
import { aboutPageSchema } from "./aboutPage";
import { companySchema } from "./company";
import { homePageSchema } from "./homePage";
import { legalPageSchema } from "./legalPage";
import { networkPersonSchema } from "./networkPerson";
import { postSchema } from "./post";
import { siteSettingsSchema } from "./siteSettings";
import { taxonomySchema } from "./taxonomy";
import { teamMemberSchema } from "./teamMember";
import { testimonialSchema } from "./testimonial";

/** Documents that exist exactly once. Give them a singleton entry in the desk. */
export const SINGLETON_DOCUMENT_TYPES = ["siteSettings", "homePage", "aboutPage"] as const;

export const documentSchemaTypes: SanityDocumentSchema[] = [
  siteSettingsSchema,
  homePageSchema,
  aboutPageSchema,
  companySchema,
  teamMemberSchema,
  postSchema,
  testimonialSchema,
  networkPersonSchema,
  taxonomySchema,
  legalPageSchema,
];

/** Objects first so a Studio that logs unresolved types resolves them in order. */
export const foundrySchemaTypes: SanitySchemaType[] = [
  ...objectSchemaTypes,
  ...documentSchemaTypes,
];

export {
  aboutPageSchema,
  companySchema,
  homePageSchema,
  legalPageSchema,
  networkPersonSchema,
  objectSchemaTypes,
  postSchema,
  siteSettingsSchema,
  taxonomySchema,
  teamMemberSchema,
  testimonialSchema,
};
