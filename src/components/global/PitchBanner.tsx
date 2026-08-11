/**
 * Global pitch CTA (§6.3, §32).
 *
 * Foundry's own words — "Are you building for the future?" — never Luminar's
 * star icon or wording. Rendered above the footer on inner routes so every page
 * ends on the conversion path.
 */

import { getHomePage, isRoutePublished } from "@/content";
import { resolvePolicyContext } from "@/content/context";
import { canRenderEditorialText } from "@/content/policy";
import { ButtonLink, Container, Section } from "@/components/ui";
import styles from "./pitch-banner.module.css";

export async function PitchBanner() {
  const policy = await resolvePolicyContext();
  const home = await getHomePage();
  const { heading, paragraphs, primaryCta } = home.contact;

  // Unapproved copy is hidden in production rather than rendered as a stub.
  if (!canRenderEditorialText(heading, policy)) return null;
  // And a banner whose only job is to send people to a route that no longer
  // exists is worse than no banner.
  if (!(await isRoutePublished(primaryCta.href, policy))) return null;

  const intro = paragraphs.filter((p) => canRenderEditorialText(p, policy));
  const ctaLabel = canRenderEditorialText(primaryCta.label, policy)
    ? primaryCta.label.value
    : "Pitch us";

  return (
    <Section
      surface="dark"
      spacing="default"
      className={styles.banner}
      aria-labelledby="pitch-banner-heading"
    >
      <Container>
        <div className={styles.inner}>
          <div>
            <h2 id="pitch-banner-heading" className={styles.heading}>
              {heading.value}
            </h2>
            {intro.map((paragraph) => (
              <p key={paragraph.value} className={styles.body}>
                {paragraph.value}
              </p>
            ))}
          </div>
          <ButtonLink href={primaryCta.href} onDark>
            {ctaLabel}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
