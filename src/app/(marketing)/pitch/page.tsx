/**
 * `/pitch` — the conversion page (§11.1, §11.3, §30).
 *
 * A server component. The only client code on the route is `PitchForm` and the
 * `Reveal` wrapper in the intro.
 *
 * The one decision worth reading twice is the readiness gate. `submitPitch`
 * cannot deliver a pitch without a configured recipient, a durable store and an
 * escalation address; `checkPitchReadiness()` reports exactly which of those are
 * missing. In production, any problem means the form is *not* rendered — a
 * founder must never spend twenty minutes writing a pitch into a form that will
 * drop it. In preview and development the same check usually fails too (the file
 * store and the log notifier are development drivers), but there the pipeline
 * genuinely works end to end, so the form is shown and the local store is
 * exactly the right place for the submission to land.
 *
 * `PitchBanner` is deliberately absent: this page is what the banner links to.
 */

import type { Metadata } from "next";
import { getContactPeople, getSiteSettings, teamContactChannels } from "@/content";
import { resolvePolicyContext } from "@/content/context";
import { canPublishTeamField } from "@/content/policy";
import { checkPitchReadiness } from "@/lib/pitch/config";
import { mailtoHref } from "@/lib/security/url";
import { buildMetadata } from "@/lib/seo/metadata";
import { Container, Section } from "@/components/ui";
import { PITCH_TITLE, PitchIntro, PitchNextSteps } from "@/components/forms/PitchIntro";
import { PitchForm } from "@/components/forms/PitchForm";
import { PitchUnavailable, type PitchContact } from "@/components/forms/PitchUnavailable";
import styles from "@/components/forms/pitch-page.module.css";

const PITCH_PATH = "/pitch";
const NEXT_STEPS_HEADING_ID = "pitch-next-steps";
const UNAVAILABLE_HEADING_ID = "pitch-unavailable";

export async function generateMetadata(): Promise<Metadata> {
  const policy = await resolvePolicyContext();
  const settings = await getSiteSettings(policy);

  return buildMetadata({
    settings,
    policy,
    path: PITCH_PATH,
    // The route's own name and the site's approved default description. Neither
    // is invented here, and no page-specific SEO document exists to override it.
    fallbackTitle: PITCH_TITLE,
    fallbackDescription: settings.defaultSeoDescription,
  });
}

export default async function PitchPage() {
  const policy = await resolvePolicyContext();
  const contactPeople = await getContactPeople(policy);

  const problems = checkPitchReadiness();
  const blocked = policy.mode === "production" && problems.length > 0;

  if (blocked) {
    // Server-side only, and keys rather than a stack trace: this is an operator
    // signal, and it must never become part of the response.
    console.error(
      `[pitch] /pitch rendered the fallback — unmet readiness requirements: ${problems
        .map((problem) => problem.key)
        .join(", ")}`,
    );
  }

  const contacts: PitchContact[] = blocked
    ? contactPeople.flatMap((person) => {
        const channels = teamContactChannels(person, policy);
        const href = mailtoHref(channels.email);
        // No publishable address means no entry — never a dead or invented link.
        if (!href || !channels.email) return [];
        return [
          {
            id: person.id,
            name: person.name,
            role: canPublishTeamField(person, "role", policy) ? person.role : null,
            email: channels.email,
            href,
          },
        ];
      })
    : [];

  return (
    <>
      <PitchIntro />

      <Section
        spacing="default"
        aria-labelledby={blocked ? UNAVAILABLE_HEADING_ID : NEXT_STEPS_HEADING_ID}
      >
        <Container>
          <div className={styles.body}>
            {blocked ? (
              <PitchUnavailable contacts={contacts} headingId={UNAVAILABLE_HEADING_ID} />
            ) : (
              <>
                <PitchNextSteps headingId={NEXT_STEPS_HEADING_ID} />
                <PitchForm />
              </>
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
