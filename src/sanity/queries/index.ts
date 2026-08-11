/**
 * One import point for the GROQ the site actually runs.
 *
 * The queries are **not** redefined here. They live next to the client that
 * executes them, in `src/content/adapters/sanity.ts`, and this module only
 * re-exports them — two copies of a projection is exactly the failure this file
 * exists to prevent: a Studio preview, a migration script or a Vision snippet
 * that quietly disagrees with what the site fetches.
 *
 * Use it for anything Studio-side that needs the real projections: preview
 * panes, `@sanity/vision` snippets, export/verification scripts, or a document
 * action that wants to see a record exactly as the site will.
 *
 * The projections and the schemas in `../schemas` are two halves of one
 * contract. If you change a field name in a schema, the projection that reads it
 * has to change with it, and it is in the adapter — not here.
 */

export { SANITY_QUERIES, readSanityConfig, type SanityConfig } from "@/content/adapters/sanity";
