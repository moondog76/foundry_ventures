/**
 * Home page (§7, §19.2, §28.2).
 *
 * A server component start to finish: the only client code on this route is the
 * `Reveal` wrapper, the stat count-up and the testimonial carousel.
 *
 * Section order is fixed by §7: hero, investment criteria, vision, offering,
 * featured portfolio, statistics, testimonials, latest insights, contact.
 * Every section decides for itself whether it has anything publishable and
 * returns `null` when it does not, so a disabled flag or unapproved copy removes
 * the block entirely instead of leaving an empty frame.
 *
 * With the shipped seed data in production policy that means most of this page
 * renders nothing at all — every home string is `unapproved` (§25.1). That is
 * the specified behaviour, not a failure. In preview (the default in dev) the
 * same code renders the full page.
 *
 * `PitchBanner` is deliberately absent: the home page closes with its own
 * `ContactCta` (§6.3).
 */

import type { Metadata } from "next";
import {
  getContactPeople,
  getFeaturedCompanies,
  getHomePage,
  getInvestmentCriteria,
  getLatestPosts,
  getSiteSettings,
  getStats,
  getTestimonials,
  isRoutePublished,
} from "@/content";
import { resolvePolicyContext } from "@/content/context";
import { buildMetadata } from "@/lib/seo/metadata";
import { ContactCta } from "@/components/home/ContactCta";
import { FeaturedPortfolio } from "@/components/home/FeaturedPortfolio";
import { HomeHero } from "@/components/home/HomeHero";
import { InvestmentCriteriaGrid } from "@/components/home/InvestmentCriteriaGrid";
import { LatestInsights } from "@/components/home/LatestInsights";
import { OfferingGrid } from "@/components/home/OfferingGrid";
import { StatsGrid } from "@/components/home/StatsGrid";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
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

  // A CTA must never point at a route behind a disabled flag (§3.4).
  const pitchEnabled = await isRoutePublished(home.hero.primaryCta.href, policy);

  const featuredSlugs = home.featuredPortfolio.companyIds.map((company) => company.slug);
  const [criteria, featuredCompanies, stats, testimonials, latestPosts, contactPeople] =
    await Promise.all([
      getInvestmentCriteria(policy),
      getFeaturedCompanies(featuredSlugs, 9, policy),
      getStats(policy),
      getTestimonials(policy),
      getLatestPosts(3, policy),
      getContactPeople(policy),
    ]);

  // Navigation labels are structural site settings, already filtered by feature
  // flag. They are the deterministic stand-in for a CTA label that has not been
  // approved yet — no CTA is ever labelled with invented copy.
  const pitchLabel = navLabel(settings.navigation, "/pitch", "Pitch");
  const portfolioLabel = navLabel(settings.navigation, "/portfolio", "Portfolio");
  const insightsLabel = navLabel(settings.navigation, "/insights", "Insights");

  const pitchCta = home.hero.primaryCta;
  const heroPitchLabel = renderableText(pitchCta.label, policy) ?? pitchLabel;

  return (
    <>
      <HomeHero
        primaryCtaEnabled={pitchEnabled}
        hero={home.hero}
        policy={policy}
        // The brand name is rendered unconditionally by the header, footer and
        // logo title, so it is the one string guaranteed to be available for the
        // page's single h1 when the authored heading is still unapproved.
        fallbackHeading={settings.displayBrandName}
        primaryCtaFallbackLabel={pitchLabel}
        secondaryCtaFallbackLabel={portfolioLabel}
      />

      <InvestmentCriteriaGrid
        ctaEnabled={pitchEnabled}
        criteria={criteria}
        ctaHref={pitchCta.href}
        ctaLabel={heroPitchLabel}
      />

      <VisionSection vision={home.vision} policy={policy} />

      <OfferingGrid offering={home.offering} policy={policy} />

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

      <StatsGrid
        stats={stats}
        heading={renderableText(home.optionalSections?.statsHeading, policy)}
      />

      <TestimonialsCarousel
        testimonials={testimonials}
        policy={policy}
        heading={renderableText(home.optionalSections?.testimonialsHeading, policy)}
      />

      <LatestInsights
        posts={latestPosts}
        policy={policy}
        heading={renderableText(home.optionalSections?.latestInsightsHeading, policy)}
        ctaLabel={
          renderableText(home.optionalSections?.latestInsightsCtaLabel, policy) ?? insightsLabel
        }
        ctaHref="/insights"
      />

      <ContactCta
        primaryCtaEnabled={pitchEnabled}
        contact={home.contact}
        people={contactPeople}
        policy={policy}
        // The live site serves the same ocean bytes in both places; the rebuild
        // deduplicates to the single asset the hero already loaded (§5.5).
        image={home.hero.image}
        primaryCtaFallbackLabel={pitchLabel}
      />
    </>
  );
}
