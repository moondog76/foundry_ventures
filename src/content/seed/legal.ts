/**
 * Legal pages seed.
 *
 * Rewritten 2026-08-12 to match the data flows the site actually has (§8.12).
 * The audit found two defects here, and they compounded each other:
 *
 *   - **§2.9 defect 4** — the notice said registered entity details "are
 *     pending confirmation … and will be stated in full before this notice is
 *     published", on a page that was already published, indexed and in the
 *     sitemap. Draft language shipped as final.
 *   - **§2.9 defect 5** — it documented a pitch form in detail: eight collected
 *     fields, deck and video links, a consent checkbox, transactional email
 *     notifications and a 730-day retention period. None of that exists. The
 *     route 404'd and the whole pipeline is now deleted (§17).
 *
 * A privacy notice describing collection that does not happen is not a harmless
 * over-disclosure. It tells a regulator the controller does not know its own
 * processing, and it tells a founder that submitting a deck is a thing this site
 * does. Both were wrong.
 *
 * What the site does now, in full: it serves static pages, `mailto:` and `tel:`
 * links, and one decorative video. There is no form, no analytics, no marketing
 * script, no advertising cookie and no third-party embed. The only personal data
 * that exists is what the hosting platform records to serve a request, plus
 * whatever someone chooses to put in an email they send us.
 *
 * Two things remain owner/counsel decisions and are deliberately NOT written
 * here — see `docs/content-gaps.md` §D:
 *   - the registered legal entity, organisation number and postal address;
 *   - the hosting provider's actual server-log retention period.
 * Both are stated as what we can substantiate rather than guessed at.
 */

import type { LegalPage, RichText } from "../types";

function p(text: string): RichText[number] {
  return { type: "paragraph", spans: [{ text }] };
}

function h(level: 2 | 3, text: string): RichText[number] {
  return { type: "heading", level, spans: [{ text }] };
}

function bullets(items: string[]): RichText[number] {
  return { type: "list", style: "bullet", items: items.map((text) => [{ text }]) };
}

const PRIVACY_CONTACT = "anders.nygren@foundryventures.ai";

const privacyBody: RichText = [
  p(
    "This notice explains what personal data Foundry Ventures collects through this website, why, how long we keep it and what rights you have.",
  ),

  h(2, "The short version"),
  p(
    "This website has no forms, no accounts, no analytics and no advertising or marketing scripts. It does not set a tracking cookie, so it does not ask you to accept one. If you have not emailed or called us, we hold nothing about you beyond the ordinary server records described below.",
  ),

  h(2, "Who is responsible for your data"),
  p(
    "Foundry Ventures is the data controller for the personal data described here. You can reach us about any privacy question at " +
      `${PRIVACY_CONTACT}.`,
  ),

  h(2, "What we collect"),
  h(3, "When you browse the site"),
  p(
    "Our hosting provider records the ordinary technical information needed to serve and secure a website: the network address the request came from, the time, the page requested, and the browser's user-agent string. We do not combine these records with anything else, and we do not use them to build a profile of you.",
  ),
  p(
    "This site sets no advertising or analytics cookies and loads no third-party marketing scripts. The only cookies it may set are strictly necessary ones — for example the signed cookie an editor's browser holds while previewing unpublished content.",
  ),
  p(
    "If you pause the background video, that choice is stored in your own browser for the rest of the session. It never reaches us.",
  ),

  h(3, "When you contact us"),
  p(
    "The site publishes email addresses and a telephone number as direct links. If you use them, you are writing to us in the ordinary way: we receive whatever you choose to send, in our own email and telephone systems, and we keep it for as long as the conversation and any resulting relationship require.",
  ),
  p(
    "We do not run a pitch form and we do not ask you to upload a deck through this website.",
  ),

  h(2, "Why we use it, and on what basis"),
  p(
    "Server records are processed on the basis of our legitimate interest in operating and securing the website. Correspondence you send us is processed on the basis of our legitimate interest in evaluating and pursuing investment opportunities, and in replying to you.",
  ),

  h(2, "Who can see it"),
  bullets([
    "Our hosting provider, which processes server records on our behalf in order to run the site.",
    "Our email and telephone providers, for correspondence you send us.",
    "The Foundry Ventures team.",
  ]),
  p("We do not sell personal data and we do not share it with advertisers."),

  h(2, "How long we keep it"),
  p(
    "Server records are kept for the period our hosting provider retains them, and are not archived by us separately. Correspondence is kept for as long as it is relevant to a possible or existing relationship, and is deleted when it is not.",
  ),

  h(2, "Your rights"),
  p(
    `You can ask us for a copy of the personal data we hold about you, ask us to correct it, ask us to delete it, or object to our processing. Write to ${PRIVACY_CONTACT} and we will respond within one month.`,
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
    lastUpdated: "2026-08-12",
    body: privacyBody,
    seo: {
      title: "Privacy",
      description:
        "What personal data Foundry Ventures collects through this website, why, how long we keep it and your rights.",
      /*
       * Still unapproved, and deliberately so. Every sentence above is now true
       * of the shipped site, which the previous version was not — but §14.5
       * requires counsel approval before a privacy notice is final, and the
       * registered entity details are still missing. The difference is that
       * nothing here is draft *language* any more: the page reads as finished
       * because it is, pending sign-off on facts nobody has supplied yet.
       */
      approvalStatus: "unapproved",
    },
  },
];
