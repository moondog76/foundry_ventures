/**
 * Legal pages seed.
 *
 * §15.1 / §11.4. The processing description below is derived directly from the
 * implementation in `src/lib/pitch` — it states what the code actually does, so
 * it is verifiable rather than boilerplate. The controller identity, retention
 * period and supervisory-authority details need a named legal owner before this
 * page can be published; those gaps are tracked in `docs/content-gaps.md` and
 * the page's `approvalStatus` keeps it out of production until signed off.
 */

import type { LegalPage, RichText } from "../types";

/** Days a pitch submission is retained before deletion (mirrors PITCH_RETENTION_DAYS). */
export const PITCH_RETENTION_DAYS = 730;

function p(text: string): RichText[number] {
  return { type: "paragraph", spans: [{ text }] };
}

function h(level: 2 | 3, text: string): RichText[number] {
  return { type: "heading", level, spans: [{ text }] };
}

function bullets(items: string[]): RichText[number] {
  return { type: "list", style: "bullet", items: items.map((text) => [{ text }]) };
}

const privacyBody: RichText = [
  p(
    "This notice explains what personal data Foundry Ventures collects through this website, why we collect it, how long we keep it and what rights you have.",
  ),

  h(2, "Who is responsible for your data"),
  p(
    "Foundry Ventures is the data controller for the personal data described here. The registered entity details and postal address are pending confirmation by our legal owner and will be stated in full before this notice is published.",
  ),
  p("Until then, you can reach us about any privacy question at anders.nygren@foundryventures.ai."),

  h(2, "What we collect"),
  h(3, "When you submit a pitch"),
  p("The pitch form asks for the information we need to evaluate an investment opportunity:"),
  bullets([
    "Your first name, last name and email address.",
    "Your company name, and its website if you have one.",
    "Your country, and the country you type in if you choose “Other”.",
    "Your current stage and the amount of funding raised, in euro.",
    "Your one-line pitch and a longer description of the company.",
    "Optional links to a deck or a video.",
    "Optionally, how you heard about us.",
    "The time you gave consent to this notice.",
  ]),
  p(
    "We also store a short-lived, irreversible hash derived from your network address. It is used only to rate-limit the form and to prevent duplicate submissions, and it cannot be reversed back to an address.",
  ),

  h(3, "When you browse the site"),
  p(
    "This site sets no advertising or analytics cookies and loads no third-party marketing scripts. The only cookies we may set are strictly necessary ones — for example the signed cookie used by editors when previewing unpublished content.",
  ),

  h(2, "Why we use it, and on what basis"),
  p(
    "We process pitch submissions to assess a possible investment and to reply to you. The legal basis is our legitimate interest in evaluating investment opportunities, together with your explicit consent to this notice, which you give by ticking the consent box on the form.",
  ),

  h(2, "Who can see it"),
  p(
    "Pitch submissions are readable by the Foundry Ventures investment team. We use a transactional email provider to notify the team that a submission has arrived; that notification contains only the sender's name, company and email so the team can find the record. We do not sell personal data, and we do not share it with advertisers.",
  ),

  h(2, "How long we keep it"),
  p(
    `Pitch submissions are retained for ${PITCH_RETENTION_DAYS} days from the date of submission and are then deleted. The rate-limiting hash is discarded within 24 hours. This retention period is subject to confirmation by our legal owner.`,
  ),

  h(2, "Your rights"),
  p(
    "You can ask us for a copy of the personal data we hold about you, ask us to correct it, ask us to delete it, or object to our processing. Write to anders.nygren@foundryventures.ai and we will respond within one month.",
  ),
  p(
    "If you are in the EU or EEA and believe we have handled your data improperly, you can complain to your national data protection authority. In Sweden that is Integritetsskyddsmyndigheten (IMY).",
  ),

  h(2, "Changes to this notice"),
  p(
    "If we change how we handle personal data, we will update this page and the date shown above it.",
  ),
];

export const SEED_LEGAL_PAGES: LegalPage[] = [
  {
    slug: "privacy",
    title: "Privacy",
    // Set to the snapshot date; a real publication date replaces it at sign-off.
    lastUpdated: "2026-08-10",
    body: privacyBody,
    seo: {
      title: "Privacy",
      description:
        "What personal data Foundry Ventures collects through this website, why, how long we keep it and your rights.",
      approvalStatus: "unapproved",
    },
  },
];
