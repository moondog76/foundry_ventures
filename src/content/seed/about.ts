/**
 * About / Thesis seed (P1, feature-flagged off).
 *
 * §13: this page must systematise Foundry's *existing* voice rather than copy
 * Luminar's values. Every belief below is drawn from live Foundry copy —
 * "AI is more transformational than just another technology shift", shipping
 * velocity, bold go-to-market, AI-native operating models, build better
 * together, efficient capital allocation.
 *
 * Headings quoting the live site are `migrated-verbatim`; all connective and
 * structural copy is `proposed` and unapproved.
 */

import type { AboutPage } from "../types";
import { migratedVerbatim, proposed } from "./evidence";
import { DEFAULT_OG_IMAGE } from "./images";

const HOME_URL = "https://www.foundryventures.ai/";

export const SEED_ABOUT_PAGE: AboutPage = {
  publicationStatus: "draft",

  heading: proposed("How we think, and how we work"),
  intro: [
    migratedVerbatim(
      "We believe that we can build better together, which is why we provide relentless support focused on a few areas. Shipping velocity, go-to-market and AI-native operating models. And funding. Our mission is to stand behind the bold ones, the ones building products that elevate industries and redefine what’s possible.",
      { sourceUrl: HOME_URL },
    ),
  ],

  beliefs: [
    {
      title: migratedVerbatim("AI is more transformational than just another technology shift", {
        sourceUrl: HOME_URL,
      }),
      body: migratedVerbatim(
        "Many of the worlds challenges will be addressed by the convergence of artificial intelligence and human ingenuity, creating unprecedented opportunities across industries. We see AI as a powerful enabler, transforming the way we work and solve problems.",
        { sourceUrl: HOME_URL },
      ),
    },
    {
      title: proposed("Shipping velocity compounds"),
      body: proposed(
        "We look for founders with a relentless focus on shipping velocity — teams that turn a week of learning into a week of shipped product.",
      ),
    },
    {
      title: proposed("Go-to-market is a product decision"),
      body: proposed(
        "A bold go-to-market approach is not a phase that follows the build. We back teams that treat distribution as part of the product from the first release.",
      ),
    },
    {
      title: proposed("AI-native operating models change the unit economics"),
      body: proposed(
        "Companies built with an AI-based operating model run leaner and decide faster. That is where efficient capital allocation starts.",
      ),
    },
  ],

  howWeWork: [
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

  whatWeLookFor: [
    {
      title: proposed("Founders who ship"),
      body: proposed("Evidence of speed: something real in front of users, early and often."),
    },
    {
      title: proposed("A bold go-to-market thesis"),
      body: proposed("A clear, specific view of who buys first and why they switch."),
    },
    {
      title: proposed("An AI-native operating model"),
      body: proposed("AI in how the company runs, not only in what it sells."),
    },
  ],

  process: [
    {
      step: "01",
      title: proposed("Submit your pitch"),
      body: proposed("One form, no warm intro required. We read everything that comes in."),
    },
    {
      step: "02",
      title: proposed("First conversation"),
      body: proposed("A direct conversation with a partner about the problem and the plan."),
    },
    {
      step: "03",
      title: proposed("Deep dive"),
      body: proposed("Product, market and team, together with the people who would work with you."),
    },
    {
      step: "04",
      title: proposed("Decision"),
      body: proposed("A clear yes or no, with the reasoning behind it."),
    },
  ],

  seo: {
    title: "About Foundry Ventures",
    description:
      "How Foundry Ventures thinks about AI-native companies, and how we work with pre-seed founders in the Nordics.",
    ogImage: DEFAULT_OG_IMAGE,
    approvalStatus: "unapproved",
  },
};
