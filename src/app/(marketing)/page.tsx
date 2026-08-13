/**
 * Home page.
 *
 * Section order follows §8.2-§8.8: hero, investment model strip, selected
 * portfolio proof, thesis, what changes after Foundry, founder proof and
 * decision-maker, contact. Portfolio proof sits third rather than sixth, which
 * is the structural change the audit asked for — §14.1 requires proof within the
 * first two scrolls, and the old page put four sections of argument first.
 *
 * A server component start to finish. The only client code on this route is the
 * ocean playback control and the scroll `Reveal` wrapper, both of which are
 * enhancements over content that is already in the server-rendered HTML (§12.1).
 *
 * Every section still decides for itself whether it has anything publishable and
 * returns `null` when it does not, so unapproved copy removes a block rather
 * than leaving an empty frame.
 */

import type { Metadata } from "next";
import {
  getContactPeople,
  getDecisionMakers,
  getFeaturedCompanies,
  getHomePage,
  getInvestmentCriteria,
  getSiteSettings,
} from "@/content";
import { resolvePolicyContext } from "@/content/context";
import { buildMetadata } from "@/lib/seo/metadata";
import { ContactCta } from "@/components/home/ContactCta";
import { DecisionMakers } from "@/components/home/DecisionMakers";
import { FeaturedPortfolio } from "@/components/home/FeaturedPortfolio";
import { HomeHero } from "@/components/home/HomeHero";
import { InvestmentCriteriaGrid } from "@/components/home/InvestmentCriteriaGrid";
import { OfferingGrid } from "@/components/home/OfferingGrid";
import { VisionSection } from "@/components/home/VisionSection";
import { navLabel, renderableText } from "@/components/home/text";

/** A meta description longer than this is truncated by every search engine. */
const MAX_DERIVED_DESCRIPTION = 200;

export async function generateMetadata(): Promise<Metadata> {
  const policy = await resolvePolicyContext();
  const [settings, home] = await Promise.all([getSiteSettings(policy), getHomePage()]);

  // Fallbacks are derived, never invented: the site's configured default title,
  // and the home page's own first paragraph when it is both approved and short
  // enough to serve as a description.
  const heroLead = renderableText(home.hero.paragraphs[0], policy);
  const fallbackDescription =
    heroLead && heroLead.length <= MAX_DERIVED_DESCRIPTION
      ? heroLead
      : settings.defaultSeoDescription;

  return buildMetadata({
    settings,
    policy,
    path: "/",
    fallbackTitle: settings.defaultSeoTitle,
    fallbackDescription,
    seo: home.seo,
    type: "website",
  });
}

export default async function HomePage() {
  const policy = await resolvePolicyContext();
  const [home, settings] = await Promise.all([getHomePage(), getSiteSettings(policy)]);

  /*
   * §8.4 asks for six, editorially chosen — and says in the same section that
   * Foundry, not Claude Code, must approve which six, and that until then the
   * build renders the published set in data order. The limit is the list's own
   * length rather than a number, so adding a company to the seed never requires
   * editing this file to make it appear.
   */
  const featuredSlugs = home.featuredPortfolio.companyIds.map((company) => company.slug);
  const [criteria, featuredCompanies, decisionMakers, contactPeople] = await Promise.all([
    getInvestmentCriteria(policy),
    getFeaturedCompanies(featuredSlugs, featuredSlugs.length, policy),
    getDecisionMakers(policy),
    getContactPeople(policy),
  ]);

  // Navigation labels are structural site settings. They are the deterministic
  // stand-in for a CTA label that has not been approved yet — no CTA is ever
  // labelled with invented copy.
  const portfolioLabel = navLabel(settings.navigation, "/portfolio", "Portfolio");
  const fundLabel = navLabel(settings.navigation, "/fund", "Fund");

  return (
    <>
      <HomeHero
        hero={home.hero}
        policy={policy}
        // The brand name is rendered unconditionally by the header, footer and
        // logo title, so it is the one string guaranteed to be available for the
        // page's single h1 when the authored heading is still unapproved.
        fallbackHeading={settings.displayBrandName}
        primaryCtaFallbackLabel={portfolioLabel}
        secondaryCtaFallbackLabel={fundLabel}
      />

      <InvestmentCriteriaGrid criteria={criteria} />

      <FeaturedPortfolio
        companies={featuredCompanies}
        policy={policy}
        heading={renderableText(home.featuredPortfolio.heading, policy)}
        intro={renderableText(home.featuredPortfolio.intro, policy)}
        // No fallback: an absent label means the section deliberately has no link.
        ctaLabel={
          home.featuredPortfolio.ctaLabel
            ? (renderableText(home.featuredPortfolio.ctaLabel, policy) ?? portfolioLabel)
            : undefined
        }
        ctaHref={home.featuredPortfolio.ctaHref}
      />

      <VisionSection vision={home.vision} policy={policy} />

      <OfferingGrid offering={home.offering} policy={policy} />

      <DecisionMakers
        people={decisionMakers}
        policy={policy}
        link={{ href: "/fund", label: "How the fund works" }}
      />

      <ContactCta
        contact={home.contact}
        people={contactPeople}
        policy={policy}
        // §8.8: return to the deep-blue field, reusing the poster the hero has
        // already loaded rather than running a second independent video.
        image={home.hero.image}
      />
    </>
  );
}

