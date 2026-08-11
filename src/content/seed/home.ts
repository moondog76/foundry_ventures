/**
 * Home page seed content.
 *
 * Every string below is either:
 *   `migrated-verbatim` — Appendix C, word for word from the 2026-08-10 live
 *                          snapshot, including its current-state spelling
 *                          ("worlds", "AI native", "early stage"), OR
 *   `proposed`          — new eyebrow / CTA / section copy from the Claude
 *                          prototype or the buildspec.
 *
 * Both start `unapproved` (§25.1). The copy-issue list in §25.2 is an editorial
 * diff for approval, not something this file silently applies.
 */

import type { HomePage } from "../types";
import { migratedVerbatim, proposed } from "./evidence";
import { ARCHITECTURE_IMAGE, DEFAULT_OG_IMAGE, OCEAN_IMAGE, SILHOUETTE_IMAGE } from "./images";
import { ANDERS_REF, JULIA_REF } from "./team";
import { SEED_COMPANIES } from "./companies";

const HOME_URL = "https://www.foundryventures.ai/";

export const SEED_HOME_PAGE: HomePage = {
  publicationStatus: "published",

  hero: {
    // Not live copy — proposed in the buildspec (§7.1) and explicitly unapproved.
    eyebrow: proposed("Pre-seed · Nordics"),
    heading: migratedVerbatim(
      "Partnering with visionary AI founders pioneering the era of services-as-a-software",
      { sourceUrl: HOME_URL },
    ),
    paragraphs: [
      migratedVerbatim(
        "There has never been a better time to build. To build AI native products that solve hard problems. To build companies with an AI based operating model. We look for early stage founders with a relentless focus on shipping velocity and a bold go-to-market approach.",
        { sourceUrl: HOME_URL },
      ),
      migratedVerbatim(
        "Foundry offers an efficient investment process and a curated community for cross company learning. We are industry agnostic, embedded in the Nordics and focused on the pre-seed stage. Sometimes we lose sleep over the amazing future of software.",
        {
          sourceUrl: HOME_URL,
          normalizationNote:
            'The live source has two spaces between "for" and "cross"; collapsed to one as whitespace cleanup only. Wording is unchanged.',
        },
      ),
    ],
    primaryCta: { label: proposed("Submit your pitch"), href: "/pitch" },
    secondaryCta: { label: proposed("Explore our portfolio"), href: "/portfolio" },
    image: OCEAN_IMAGE,
  },

  vision: {
    eyebrow: migratedVerbatim("Vision", { sourceUrl: HOME_URL }),
    heading: migratedVerbatim("AI is more transformational than just another technology shift", {
      sourceUrl: HOME_URL,
    }),
    paragraphs: [
      migratedVerbatim(
        "Many of the worlds challenges will be addressed by the convergence of artificial intelligence and human ingenuity, creating unprecedented opportunities across industries. We see AI as a powerful enabler, transforming the way we work and solve problems.",
        { sourceUrl: HOME_URL },
      ),
      migratedVerbatim(
        "At Foundry, we focus on this exponential impact of AI. This means investing early in visionary founders building tomorrow’s services-as-a-software technology.",
        { sourceUrl: HOME_URL },
      ),
      migratedVerbatim(
        "We believe that we can build better together, which is why we provide relentless support focused on a few areas. Shipping velocity, go-to-market and AI-native operating models. And funding. Our mission is to stand behind the bold ones, the ones building products that elevate industries and redefine what’s possible.",
        { sourceUrl: HOME_URL },
      ),
    ],
  },

  offering: {
    eyebrow: migratedVerbatim("Offering", { sourceUrl: HOME_URL }),
    items: [
      {
        number: "01",
        body: migratedVerbatim(
          "A carefully selected AI native tech stack optimized for an efficient operating model",
          { sourceUrl: HOME_URL },
        ),
      },
      {
        number: "02",
        body: migratedVerbatim(
          "Well-managed community with dedicated channels and events designed for rapid cross-learning",
          { sourceUrl: HOME_URL },
        ),
      },
      {
        number: "03",
        body: migratedVerbatim(
          "Expert support in developing growth engines for a solid go-to-market strategy",
          { sourceUrl: HOME_URL },
        ),
      },
      {
        number: "04",
        body: migratedVerbatim(
          "Comprehensive knowledge base and credits system for an efficient capital allocation",
          { sourceUrl: HOME_URL },
        ),
      },
    ],
    images: [ARCHITECTURE_IMAGE, SILHOUETTE_IMAGE],
  },

  featuredPortfolio: {
    // Prototype-derived heading — usable only after editorial approval (§7.5).
    heading: proposed("The bold ones we stand behind"),
    companyIds: SEED_COMPANIES.slice(0, 8).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
    })),
    ctaLabel: proposed("See full portfolio"),
    ctaHref: "/portfolio",
  },

  optionalSections: {
    statsHeading: proposed("Foundry in numbers"),
    testimonialsHeading: proposed("From the founders we back"),
    latestInsightsHeading: proposed("News & Insights"),
    latestInsightsCtaLabel: proposed("See all insights"),
  },

  contact: {
    heading: migratedVerbatim("Are you building for the future?", { sourceUrl: HOME_URL }),
    paragraphs: [
      migratedVerbatim("Planning to build, already on your way or maybe just about to launch?", {
        sourceUrl: HOME_URL,
      }),
      migratedVerbatim("Reach out, we would love to get to know you.", { sourceUrl: HOME_URL }),
    ],
    primaryCta: { label: proposed("Submit your pitch"), href: "/pitch" },
    secondaryCta: { label: proposed("Email Anders"), contactPerson: ANDERS_REF },
    contactPeople: [ANDERS_REF, JULIA_REF],
  },

  seo: {
    // Current-state metadata from Appendix C.3, trailing whitespace trimmed.
    title: "Foundry ventures",
    description:
      "Early-Stage Investor | Focused on AI-Driven SaaS 2.0 | Partnering with Visionary Founders to Build Tomorrow's Critical Tech",
    ogImage: DEFAULT_OG_IMAGE,
    approvalStatus: "approved",
    sources: [
      {
        label: "Foundry Ventures home <title> and meta description",
        url: HOME_URL,
        observedAt: "2026-08-10",
      },
    ],
  },
};
