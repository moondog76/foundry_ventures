/**
 * About / Thesis seed (P1, feature-flagged off).
 *
 * Rewritten alongside the home page for the 2026-08-11 repositioning so that
 * enabling this route later cannot contradict the position the rest of the site
 * states. Same provenance as the home copy: written on the owner's instruction,
 * approved by it, not reviewed line by line.
 */

import type { AboutPage } from "../types";
import { authoredOnInstruction } from "./evidence";
import { DEFAULT_OG_IMAGE } from "./images";

export const SEED_ABOUT_PAGE: AboutPage = {
  publicationStatus: "draft",

  heading: authoredOnInstruction("A different job from venture capital"),
  intro: [
    authoredOnInstruction(
      "Foundry writes €100k or €200k into AI teams, one to three times a month. We decide on the people, we move at the speed of a conversation, and after the cheque we spend our time on capital and customer introductions.",
    ),
  ],

  beliefs: [
    {
      title: authoredOnInstruction("The team is the only thing that compounds"),
      body: authoredOnInstruction(
        "Models change monthly and product surfaces get rebuilt in a weekend. A small group of people who ship faster than the field moves is the one asset that survives that.",
      ),
    },
    {
      title: authoredOnInstruction("Most early diligence prices the wrong thing"),
      body: authoredOnInstruction(
        "Market sizing, competitive matrices and defensibility stories written before there are customers describe a world that will have changed by the next release. We do not ask for them.",
      ),
    },
    {
      title: authoredOnInstruction("A fixed cheque removes a negotiation"),
      body: authoredOnInstruction(
        "€100k or €200k, published in advance. Founders know what is on offer before the first meeting, and nobody spends a month arriving at a number.",
      ),
    },
    {
      title: authoredOnInstruction("Frequency is a strategy, not an accident"),
      body: authoredOnInstruction(
        "One to three investments a month keeps us in the flow of what is actually being built, and gives every team a cohort hitting the same problems at the same time.",
      ),
    },
  ],

  howWeWork: [
    {
      number: "01",
      body: authoredOnInstruction(
        "Capital. €100k or €200k, decided on the team, one to three times a month.",
      ),
    },
    {
      number: "02",
      body: authoredOnInstruction(
        "Customer introductions. The first thing founders ask for, and where most of our time goes.",
      ),
    },
    {
      number: "03",
      body: authoredOnInstruction(
        "Legal and operations support, so the work that does not build the product stops landing on the founders.",
      ),
    },
    {
      number: "04",
      body: authoredOnInstruction(
        "A working community of AI founders, with dedicated channels and events.",
      ),
    },
  ],

  whatWeLookFor: [
    {
      title: authoredOnInstruction("People who ship"),
      body: authoredOnInstruction(
        "Something real in front of users, early and often. It is the only evidence that survives contact with a moving field.",
      ),
    },
    {
      title: authoredOnInstruction("A team that has already chosen each other"),
      body: authoredOnInstruction(
        "We are backing the group, so how you decide together matters more than any slide about the market.",
      ),
    },
    {
      title: authoredOnInstruction("AI at the centre, industry wherever"),
      body: authoredOnInstruction(
        "The technology is the one thing we are strict about. The sector is entirely yours to choose.",
      ),
    },
  ],

  process: [
    {
      step: "01",
      title: authoredOnInstruction("A conversation"),
      body: authoredOnInstruction("No deck required. We want to meet the people building it."),
    },
    {
      step: "02",
      title: authoredOnInstruction("Time with the team"),
      body: authoredOnInstruction("Together, and separately. This is the diligence."),
    },
    {
      step: "03",
      title: authoredOnInstruction("A decision"),
      body: authoredOnInstruction("A clear yes or no, with the reasoning behind it."),
    },
  ],

  seo: {
    title: "About Foundry Ventures",
    description:
      "Why Foundry backs AI teams rather than markets, and what a €100k or €200k cheque comes with.",
    ogImage: DEFAULT_OG_IMAGE,
    approvalStatus: "approved",
  },
};
