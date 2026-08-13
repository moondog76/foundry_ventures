/**
 * `/fund` — the quiet institutional layer (§8.11).
 *
 * The audit scored the old site 5.8/10 for LP confidence: the public team was
 * one name in a closing paragraph, the operating model was asserted rather than
 * evidenced, and the copy actively denied being a fund. This route answers those
 * questions one click from the homepage without turning the public brand into
 * fundraising collateral.
 *
 * §14.1's test is that an LP reaches model, people, institutional details and
 * contact within two clicks. Header → Fund is one.
 *
 * The facts strip renders from the same `getInvestmentCriteria()` source as the
 * homepage rather than a second copy, so the two can never disagree.
 */

import type { Metadata } from "next";
import {
  getFundPage,
  getInvestmentCriteria,
  getSiteSettings,
  isRoutePublished,
} from "@/content";
import { resolvePolicyContext } from "@/content/context";
import { buildMetadata } from "@/lib/seo/metadata";
import { Container, Section } from "@/components/ui";
import { InvestmentCriteriaGrid } from "@/components/home/InvestmentCriteriaGrid";
import { FundModel } from "@/components/fund/FundModel";
import { InstitutionalDetails } from "@/components/fund/InstitutionalDetails";
import { FundContact } from "@/components/fund/FundContact";
import { renderableText } from "@/components/home/text";
import styles from "./fund.module.css";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await resolvePolicyContext();
  const [settings, fund] = await Promise.all([getSiteSettings(policy), getFundPage()]);
  return buildMetadata({
    settings,
    policy,
    path: "/fund",
    fallbackTitle: "The fund",
    fallbackDescription: settings.defaultSeoDescription,
    // Hidden means "not advertised": absent from navigation and the sitemap,
    // and not listed by a crawler that reaches it some other way. The route
    // still resolves, so no shared link breaks (§3.4).
    noIndex: !(await isRoutePublished("/fund", policy)),
    seo: fund.seo,
    type: "website",
  });
}

export default async function FundRoute() {
  const policy = await resolvePolicyContext();
  const [fund, settings, criteria] = await Promise.all([
    getFundPage(),
    getSiteSettings(policy),
    getInvestmentCriteria(policy),
  ]);

  const heading = renderableText(fund.hero.heading, policy);
  const intro = renderableText(fund.hero.intro, policy);

  return (
    <>
      <Section surface="dark" className={styles.hero} aria-labelledby="fund-heading">
        <Container>
          <h1 id="fund-heading" className={styles.heroHeading}>
            {heading ?? "The fund"}
          </h1>
          {intro ? <p className={styles.heroIntro}>{intro}</p> : null}
        </Container>
      </Section>

      <InvestmentCriteriaGrid criteria={criteria} />

      <FundModel model={fund.model} policy={policy} />

      <FundContact contact={fund.contact} policy={policy} />

      {/*
        Legal entity, registered address, organisation number and any regulatory
        statement. Renders only when `featureFlags.institutionalDetails` is on,
        which requires counsel-approved values — §16 blocks the affected content
        rather than publishing draft language.
      */}
      <InstitutionalDetails settings={settings} />
    </>
  );
}

/** Nothing here depends on the request; the page is fully static. */
export const dynamic = "error";
