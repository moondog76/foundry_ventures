/**
 * Founder quote (§9.1).
 *
 * Conditional on the quote and the attributed name both existing — an
 * unattributed quotation is not publishable. No heading is rendered: the pull
 * quote is its own landmark, and inventing a section title above it would be
 * adding editorial voice the content owner never approved.
 *
 * A LinkedIn URL is rendered only when it survives protocol sanitisation.
 */

import type { FounderQuote as FounderQuoteData } from "@/content/types";
import { ExternalLink } from "@/components/global/ExternalLink";
import { Reveal } from "@/components/ui/Reveal";
import { sanitizeWebUrl } from "@/lib/security/url";
import styles from "./founder-quote.module.css";

export function FounderQuote({ quote }: { quote: FounderQuoteData | undefined }) {
  const text = quote?.quote.trim();
  const name = quote?.name.trim();
  if (!quote || !text || !name) return null;

  const linkedinUrl = sanitizeWebUrl(quote.linkedinUrl);
  // "CEO, Stockholm" — both halves optional, joined only when both exist.
  const meta = [quote.title?.trim(), quote.location?.trim()].filter(Boolean).join(", ");

  return (
    <Reveal as="figure" className={styles.figure}>
      <blockquote className={styles.quote}>
        <p className={styles.quoteText}>{text}</p>
      </blockquote>
      <figcaption className={styles.caption}>
        <span className={styles.name}>
          {linkedinUrl ? <ExternalLink href={linkedinUrl}>{name}</ExternalLink> : name}
        </span>
        {meta ? <span className={styles.meta}>{meta}</span> : null}
      </figcaption>
    </Reveal>
  );
}
