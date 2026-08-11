/**
 * Company detail template (§9.1).
 *
 * Content order is fixed by the spec and identical in the DOM at every
 * breakpoint — the desktop split hero is achieved with grid placement, never by
 * reordering or duplicating markup:
 *
 *   breadcrumb → logo → hero image → h1 + tagline → metadata → long description
 *   → why we invested → deal lead → founder quote → links → related insights
 *   → previous/next
 *
 * Every one of those blocks is conditional on its own approved evidence. A
 * company without a founder quote renders neither the quote nor the vertical
 * rhythm it would have taken; nothing is stubbed and nothing reserves space.
 */

import type { CompanyDetailView, Company, Founder, ImageAsset } from "@/content/types";
import { canPublishCompanyField, canRenderImage, type PolicyContext } from "@/content/policy";
import { teamMemberHasDetail } from "@/content";
import { Breadcrumbs, type Crumb } from "@/components/global/Breadcrumbs";
import { Container, Section } from "@/components/ui";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { RichTextRenderer } from "@/components/ui/RichTextRenderer";
import { Reveal } from "@/components/ui/Reveal";
import { CompanyDealLead } from "./CompanyDealLead";
import { CompanyLinks } from "./CompanyLinks";
import { CompanyLogoFrame } from "./CompanyLogoFrame";
import { CompanyMetadataGrid, type CompanyMetadataItem } from "./CompanyMetadataGrid";
import { CompanyPager } from "./CompanyPager";
import { FounderQuote } from "./FounderQuote";
import { RelatedPosts } from "./RelatedPosts";
import { WhyWeInvested } from "./WhyWeInvested";
import { STATUS_LABELS } from "./labels";
import logoStyles from "./company-logo-frame.module.css";
import styles from "./company-detail.module.css";

export type CompanyDetailProps = {
  view: CompanyDetailView;
  policy: PolicyContext;
  crumbs: Crumb[];
};

type HeroMedia = { image: ImageAsset; alt?: string };

/**
 * Hero art, in descending order of intent: a dedicated hero image, the card
 * image, then a founder portrait. A founder portrait gets an alt naming the
 * person, because that is what the picture actually shows.
 */
function pickHeroMedia(
  company: Company,
  policy: PolicyContext,
  foundersPublishable: boolean,
): HeroMedia | null {
  if (canRenderImage(company.heroImage, policy)) return { image: company.heroImage };
  if (canRenderImage(company.cardImage, policy)) return { image: company.cardImage };
  if (!foundersPublishable) return null;

  const founder: Founder | undefined = (company.founders ?? []).find((candidate) =>
    canRenderImage(candidate.image, policy),
  );
  if (!founder?.image) return null;
  return {
    image: founder.image,
    alt: founder.role ? `${founder.name}, ${founder.role}` : founder.name,
  };
}

export async function CompanyDetail({ view, policy, crumbs }: CompanyDetailProps) {
  const { company, summary, dealLead, relatedPosts, previous, next } = view;

  const foundersPublishable = canPublishCompanyField(company, "founders", policy);
  const heroMedia = pickHeroMedia(company, policy, foundersPublishable);

  const tagline = summary.tagline?.trim() ?? null;
  const shortDescription = canPublishCompanyField(company, "shortDescription", policy)
    ? (company.shortDescription?.trim() ?? null)
    : null;
  // The seed data uses the same live caption for both fields; showing it twice
  // would read as a bug, so the lede only appears when it adds something.
  const lede = shortDescription && shortDescription !== tagline ? shortDescription : null;
  const body = canPublishCompanyField(company, "body", policy) ? company.body : undefined;
  const whyWeInvested = canPublishCompanyField(company, "whyWeInvested", policy)
    ? company.whyWeInvested
    : undefined;

  const metadata: CompanyMetadataItem[] = [];
  if (summary.stages.length > 0) {
    metadata.push({ label: "Stage", value: summary.stages.map((ref) => ref.title).join(", ") });
  }
  if (summary.sectors.length > 0) {
    metadata.push({ label: "Sector", value: summary.sectors.map((ref) => ref.title).join(", ") });
  }
  if (summary.focuses.length > 0) {
    metadata.push({ label: "Focus", value: summary.focuses.map((ref) => ref.title).join(", ") });
  }
  if (summary.status) {
    metadata.push({ label: "Status", value: STATUS_LABELS[summary.status] });
  }
  if (canPublishCompanyField(company, "headquarters", policy) && company.headquarters?.trim()) {
    metadata.push({ label: "Headquarters", value: company.headquarters.trim() });
  }
  if (canPublishCompanyField(company, "investmentYear", policy) && company.investmentYear) {
    metadata.push({ label: "Invested", value: String(company.investmentYear) });
  }
  if (summary.founders.length > 0) {
    metadata.push({
      label: summary.founders.length === 1 ? "Founder" : "Founders",
      value: summary.founders.map((founder) => founder.name).join(", "),
    });
  }

  const websiteUrl = canPublishCompanyField(company, "websiteUrl", policy)
    ? (company.websiteUrl ?? null)
    : null;

  // The detail route only exists for a member whose own profile page exists;
  // otherwise the name renders as plain text (§10.2).
  const dealLeadHasDetail = dealLead ? await teamMemberHasDetail(dealLead, policy) : false;

  const hasFounderQuote = Boolean(
    company.founderQuote?.quote.trim() && company.founderQuote.name.trim(),
  );
  const hasLinks = Boolean(websiteUrl || company.linkedinUrl || company.careersUrl);
  // Guarded so an otherwise-empty record cannot render a band of blank padding.
  const hasMainSection =
    metadata.length > 0 ||
    Boolean(lede) ||
    Boolean(body?.length) ||
    Boolean(whyWeInvested?.length) ||
    Boolean(dealLead) ||
    hasFounderQuote ||
    hasLinks;
  const hasPager = Boolean(previous?.href || next?.href);

  return (
    <article className={styles.detail}>
      <Section spacing="tight" className={styles.heroSection}>
        <Container>
          <Breadcrumbs items={crumbs} />

          <div className={styles.hero} data-media={heroMedia ? "true" : "false"}>
            <div className={styles.heroLogo}>
              <CompanyLogoFrame
                logo={summary.logo}
                name={company.name}
                logoFit={summary.logoFit}
                opticalScale={summary.opticalScale}
                policy={policy}
                sizes="(min-width: 992px) 260px, 220px"
                priority
                className={logoStyles.detail}
              />
            </div>

            {heroMedia ? (
              <div className={styles.heroMedia}>
                <ResponsiveImage
                  image={heroMedia.image}
                  policy={policy}
                  alt={heroMedia.alt}
                  /* ~1:1 on desktop, ~3:2 on mobile — the frame owns the ratio,
                     the asset hotspot owns the crop. */
                  sizes="(min-width: 992px) 46vw, 100vw"
                  fit="cover"
                  priority
                  frameClassName={styles.heroImageFrame}
                />
              </div>
            ) : null}

            <div className={styles.heroBody}>
              <h1 className={styles.title}>{company.name}</h1>
              {tagline ? <p className={styles.tagline}>{tagline}</p> : null}
            </div>
          </div>
        </Container>
      </Section>

      {hasMainSection ? (
        <Section spacing="tight" as="div">
          <Container>
            <CompanyMetadataGrid items={metadata} />

            {lede || body?.length ? (
              <div className={styles.narrative}>
                <div className={styles.narrativeAside}>
                  <p className={styles.narrativeLabel}>About {company.name}</p>
                </div>
                <Reveal className={styles.narrativeBody}>
                  {lede ? <p className={styles.lede}>{lede}</p> : null}
                  <RichTextRenderer value={body} policy={policy} className={styles.bodyCopy} />
                </Reveal>
              </div>
            ) : null}

            <WhyWeInvested body={whyWeInvested} policy={policy} headingId="why-we-invested" />

            <CompanyDealLead
              member={dealLead}
              hasDetailPage={dealLeadHasDetail}
              policy={policy}
              headingId="deal-lead"
            />

            <FounderQuote quote={company.founderQuote} />

            <CompanyLinks
              websiteUrl={websiteUrl}
              linkedinUrl={company.linkedinUrl ?? null}
              careersUrl={company.careersUrl ?? null}
              labelId="company-links"
            />
          </Container>
        </Section>
      ) : null}

      {relatedPosts.length > 0 ? (
        <Section spacing="tight" surface="off-white">
          <Container>
            <RelatedPosts posts={relatedPosts} headingId="related-insights" />
          </Container>
        </Section>
      ) : null}

      {hasPager ? (
        <Section spacing="tight" as="div">
          <Container>
            <CompanyPager previous={previous} next={next} />
          </Container>
        </Section>
      ) : null}
    </article>
  );
}
