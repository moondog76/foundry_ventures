/**
 * 404 (§6.4).
 *
 * This is the root `not-found`, so it renders inside the root layout: skip
 * link, header and footer are all present and the visitor is never stranded on
 * a bare page. The layout owns `<main>`; this route contributes the single
 * `<h1>` and nothing else structural.
 *
 * The copy is Foundry's, plain, and says only what is true: we do not know
 * which link brought the visitor here, so we do not guess. No status codes in
 * prose, no "the resource could not be located", no apology theatre — just the
 * three destinations that cover almost every reason someone is on this site.
 * All three routes exist unconditionally (they are not feature-flagged), so no
 * link here can ever become a dead end.
 */

import type { Metadata } from "next";
import { getSiteSettings } from "@/content";
import { resolvePolicyContext } from "@/content/context";
import { buildMetadata } from "@/lib/seo/metadata";
import { ButtonLink, Container, SectionEyebrow } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./not-found.module.css";

const NOT_FOUND_TITLE = "Page not found";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await resolvePolicyContext();
  const settings = await getSiteSettings(policy);

  const metadata = buildMetadata({
    settings,
    policy,
    // Only used to derive the OG URL below; the canonical is removed after.
    path: "/",
    fallbackTitle: NOT_FOUND_TITLE,
    // The site's own approved description. A 404 has no content of its own to
    // describe, and inventing a description for it is not an option (§21.1).
    fallbackDescription: settings.defaultSeoDescription,
    noIndex: true,
  });

  return {
    ...metadata,
    // A 404 is served at whatever address was requested, so it has no address
    // of its own. Claiming one — especially the home page's — would invite a
    // crawler to treat a missing page as a duplicate of a real one.
    alternates: { canonical: null },
  };
}

export default function NotFound() {
  return (
    // A plain element rather than the `Section` primitive: this page owns its
    // own vertical rhythm (it has to clear the fixed header and fill the first
    // screen), and `Section`'s `padding-block` maps to the same box sides, so
    // the two would resolve by stylesheet order rather than by intent.
    <div className={styles.page}>
      <Container>
        <Reveal className={styles.inner}>
          <SectionEyebrow>404</SectionEyebrow>

          <h1 className={styles.heading}>We can&rsquo;t find that page</h1>

          <p className={styles.body}>
            The link may be out of date, or the page may have moved since it was shared. These are
            the places most people are looking for.
          </p>

          <div className={styles.actions}>
            <ButtonLink href="/">Go to the home page</ButtonLink>
            <ButtonLink href="/portfolio" variant="secondary">
              See the portfolio
            </ButtonLink>
            <ButtonLink href="/pitch" variant="secondary">
              Pitch us
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </div>
  );
}
