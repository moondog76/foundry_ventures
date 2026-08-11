# Sanity Studio schemas

Everything a Sanity Studio needs to edit this site: the document and object
types, and one import point for the GROQ the site actually runs.

Nothing here is imported by the running site. The app talks to the CMS through
`src/content/adapters/sanity.ts` and never through a schema definition, so this
directory can be read, changed and reviewed without touching the site build.

## Why the schemas are plain object literals

The `sanity` package is deliberately **not** a dependency of this app. The site
has to build, typecheck and be reviewed with no CMS credentials and no Studio
toolchain — `src/content/index.ts` falls back to the local seed adapter whenever
`SANITY_PROJECT_ID` / `SANITY_DATASET` are absent (§4.2, §30).

So the schemas are plain, strongly typed object literals, checked against the
minimal shape in [`schema-types.ts`](./schema-types.ts). They are pure data with
no runtime behaviour, which means they drop straight into a Studio's
`schema.types` with one conversion step for validation.

`validation` is the one thing that cannot be data: Sanity expects a callback that
receives a `Rule`, and `Rule` lives in the package we are not importing.
Constraints are therefore carried as `validationRule` metadata and converted by
`toSanityValidation`, which names no Sanity type and works structurally.

---

## 1. Create the Studio

The Studio is a separate workspace so its dependency tree never reaches the site.

```bash
mkdir studio && cd studio
pnpm init
pnpm add sanity @sanity/vision react react-dom styled-components
```

Then create `studio/sanity.config.ts`:

```ts
import { defineConfig, type Rule, type SchemaTypeDefinition } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import {
  foundrySchemaTypes,
  toSanityValidation,
  SINGLETON_DOCUMENT_TYPES,
  type SanityValidationRule,
} from "../src/sanity";

/**
 * Walks the schema once and turns every `validationRule` into the `validation`
 * callback Sanity wants. Recurses into `fields`, `of` and rich-text annotations
 * so nested objects and array members are covered too.
 */
function attachValidation(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(attachValidation);
  if (node === null || typeof node !== "object") return node;

  const { validationRule, ...rest } = node as Record<string, unknown>;
  const output: Record<string, unknown> = { ...rest };

  for (const key of ["fields", "of"]) {
    if (Array.isArray(output[key])) {
      output[key] = (output[key] as unknown[]).map(attachValidation);
    }
  }

  const marks = output.marks as { annotations?: unknown[] } | undefined;
  if (marks?.annotations) {
    output.marks = { ...marks, annotations: marks.annotations.map(attachValidation) };
  }

  if (validationRule) {
    output.validation = (rule: Rule) =>
      toSanityValidation<Rule>(validationRule as SanityValidationRule)(rule);
  }

  return output;
}

const schemaTypes = foundrySchemaTypes.map(attachValidation) as SchemaTypeDefinition[];

export default defineConfig({
  name: "foundry",
  title: "Foundry Ventures",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET!,
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
    // Site settings, home page and about page exist exactly once. Hiding them
    // from the global "create" menu is what stops a second one appearing —
    // `*[_type == "siteSettings"][0]` would then silently pick either.
    templates: (prev) =>
      prev.filter((template) => !SINGLETON_DOCUMENT_TYPES.includes(template.id as never)),
  },
});
```

Two casts appear above and both are expected:

- `as SchemaTypeDefinition[]` — these literals are a structural _subset_ of
  Sanity's own definition union, not a re-declaration of it, and that union will
  not infer from a widened `type: string`.
- `toSanityValidation<Rule>` relies on Sanity's `Rule` structurally providing the
  methods listed in `SanityRuleLike`. If a future Sanity release changes one of
  those signatures, cast the argument at this single call site rather than
  reshaping the schemas.

### Desk structure for the singletons

```ts
structureTool({
  structure: (S) =>
    S.list()
      .title("Content")
      .items([
        S.listItem()
          .title("Site settings")
          .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
        S.listItem()
          .title("Home page")
          .child(S.document().schemaType("homePage").documentId("homePage")),
        S.listItem()
          .title("About page")
          .child(S.document().schemaType("aboutPage").documentId("aboutPage")),
        S.divider(),
        ...S.documentTypeListItems().filter(
          (item) => !["siteSettings", "homePage", "aboutPage"].includes(item.getId() ?? ""),
        ),
      ]),
});
```

---

## 2. Configure the site

The site activates the Sanity adapter as soon as a project id **and** a dataset
are present; otherwise it serves the local seed content. Every one of these is a
server-only variable — none is `NEXT_PUBLIC_*`, and none may be (§23).

| Variable                | Required         | What it does                                                                       |
| ----------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| `SANITY_PROJECT_ID`     | to use Sanity    | Project id. With `SANITY_DATASET`, switches the adapter from seed to Sanity.       |
| `SANITY_DATASET`        | to use Sanity    | Dataset name, e.g. `production`.                                                   |
| `SANITY_API_VERSION`    | no               | API date. Defaults to `2024-10-01`. Pin it; do not track "latest".                 |
| `SANITY_READ_TOKEN`     | private datasets | Read token. **Read the caution below before setting it.**                          |
| `SANITY_WEBHOOK_SECRET` | for revalidation | Shared secret for `/api/revalidate`. Without it that endpoint answers 404.         |
| `DRAFT_MODE_SECRET`     | for preview      | Enables `/api/draft/enable`. Without it there is no preview surface at all.        |
| `FOUNDRY_POLICY_MODE`   | no               | `production` or `preview`, overriding the default. Used by CI and the deploy gate. |

Studio-side, set `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` to the
same project and dataset.

> **Caution — `SANITY_READ_TOKEN` changes what the whole site fetches.**
> `readSanityConfig()` sets `perspective: "drafts"` and disables the CDN whenever
> a token is present. On a production deployment that means every request reads
> draft documents. The publishing policy still refuses to render anything whose
> `publicationStatus` is not `published`, so nothing leaks — but the site is then
> one policy bug away from publishing a draft, and it loses the CDN. Prefer a
> public dataset with no token in production, and keep the token for the preview
> deployment.

### Preview

`/api/draft/enable?secret=…&redirect=/portfolio` sets the draft cookie, which
puts the content layer into `preview` mode: unapproved copy, unverified facts and
unpublished records all render, behind a banner and `noindex`. Point the Studio's
preview URL at that endpoint.

---

## 3. Wire the revalidation webhook

`POST /api/revalidate` rebuilds the pages a changed document appears on. It
verifies Sanity's own signature scheme, so configure it as a **GROQ-powered
webhook** in _manage.sanity.io → API → Webhooks_:

| Setting        | Value                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| URL            | `https://<site>/api/revalidate`                                                                                            |
| Dataset        | the one the site reads                                                                                                     |
| Trigger on     | Create, Update, Delete                                                                                                     |
| Filter         | `_type in ["siteSettings","homePage","aboutPage","company","teamMember","post","testimonial","networkPerson","legalPage"]` |
| Projection     | `{_type, "slug": slug.current}`                                                                                            |
| HTTP method    | `POST`                                                                                                                     |
| Secret         | the same value as `SANITY_WEBHOOK_SECRET`                                                                                  |
| Include drafts | off                                                                                                                        |

The endpoint refuses more than it accepts, on purpose:

- unconfigured secret → **404**, so a deployment without the secret does not
  advertise that a webhook is waiting to be enabled;
- missing or bad signature, or a signed timestamp more than five minutes old →
  **401**; the body is never parsed before the signature verifies;
- an unrecognised `_type` → **200 with nothing revalidated**, so adding a new
  document type does not put the CMS into a retry loop;
- no path from the payload is ever passed to `revalidatePath`. The endpoint has a
  fixed vocabulary of paths and interpolates a slug only after it matches
  lowercase kebab-case.

Which paths each type invalidates is listed in
`src/app/api/revalidate/route.ts`; `siteSettings` invalidates the whole layout
plus the sitemap, robots and the share-card image.

---

## 4. How the content model works

Four ideas explain nearly every field in these schemas.

**Evidence decides what is published, not status.** Every publicly claimed fact
carries a `fieldEvidence` record, and in production a field renders only when its
own evidence is `owner-approved`. `observed` — meaning "we saw it on the old
site" — is explicitly not enough. This is why a company record degrades field by
field rather than all at once: an approved name with nothing else still produces
a working portfolio card that links to the company's own website.

**Copy is approved sentence by sentence.** Every user-visible string on the home
and about pages is an `editorialText` carrying its origin (`migrated-verbatim` or
`proposed`) and its own approval. A reviewer can approve the vision paragraph
without silently approving the tagline beside it.

**Relations point one way.** A company names its deal lead; a post names its
authors and the companies it is about. Team profiles and company pages resolve
those in reverse, so nobody has to remember to update two records
(`src/content/index.ts`, §16.4.1).

**Slugs are permanent.** Taxonomy slugs are used verbatim in query strings
(`/portfolio?sector=applied-ai`) and unknown values are dropped silently by the
filter engine. Document slugs are page addresses and are also what the
revalidation webhook uses to find the page it must rebuild. Change titles freely;
treat slugs as permanent.

Consent is tracked separately from approval on `testimonial`: `revoked` removes a
quote everywhere immediately, preview included.

---

## 5. Before switching the site from seed content to Sanity

The schemas here and the GROQ projections in `src/content/adapters/sanity.ts` are
two halves of one contract, and three parts of that contract are not yet closed.
These are adapter changes, not schema changes — they belong to whoever owns
`src/content/**`.

1. **Rich text needs a converter.** `RichText` in `src/content/types.ts` is a
   small bespoke block format; the schemas use Sanity's native Portable Text
   editor, because asking editors to hand-author `{ type: "paragraph", spans: […] }`
   objects in a Studio is not a workable content model. The projections currently
   return `body`, `whyWeInvested` and `longBio` untouched, so the adapter needs a
   `portableTextToRichText()` step. The editor is configured to emit exactly the
   subset the renderer supports — `normal`/`h2`/`h3`/`h4`, bullet and numbered
   lists, `strong`/`em`/`code`/`link`, plus `imageAsset`, `richTextQuote` and
   `richTextEmbed` — so the conversion is total, with no unmappable input.

2. **`homePage` and `aboutPage` have no projection.** Both are fetched as
   `*[_type == "…"][0]`, which returns raw Sanity shapes. Consequences: hero and
   offering images arrive without `src`, `width`, `height` or `available`, so
   `canRenderImage` refuses them and the images never appear; and
   `featuredPortfolio.companyIds`, `contact.contactPeople` and
   `contact.secondaryCta.contactPerson` arrive as unresolved references rather
   than `{ id, slug, name }`. Both documents need projections applying
   `IMAGE_PROJECTION` and dereferencing the people and companies, in the same
   style as `COMPANY_PROJECTION`.

3. **`seo` is projected raw everywhere.** `seo.ogImage` therefore never becomes
   an `ImageAsset`. An `SEO_PROJECTION` applying `IMAGE_PROJECTION` to `ogImage`,
   used by the company, team, post, legal, home and about queries, closes it.

Two smaller notes:

- **Taxonomy edits do not revalidate anything.** `taxonomy` is not in the
  webhook's switch, and the pages that render taxonomy titles are static — so
  renaming a term will not reach the site until something else on those pages
  changes. Adding a `taxonomy` case that revalidates `/portfolio` and `/network`
  would close it.
- **Slug uniqueness** relies on Sanity's built-in check for the `slug` type.
  Cross-type collisions are not checked; the one that would actually hurt —
  a `legalPage` slug shadowing a section of the site — is checked in the schema.
