/**
 * `/pitch` introduction and expectation-setting (§11.1).
 *
 * Provenance of the copy below, because none of it may be invented:
 *
 *  - the fit statement paraphrases the live home page, observed 2026-08-10:
 *    "We are industry agnostic, embedded in the Nordics and focused on the
 *    pre-seed stage" and "Partnering with visionary AI founders …". Nothing is
 *    claimed here that Foundry does not already say about itself in public;
 *  - "an idea, an MVP or early customers are all welcome" restates the live
 *    contact block: "Planning to build, already on your way or maybe just about
 *    to launch?";
 *  - `PitchNextSteps` describes what the system actually does — a durable write
 *    followed by a notification, and a reply by email. There is deliberately no
 *    response-time commitment: nobody has verified one, so stating one would be
 *    inventing a promise on Foundry's behalf.
 *
 * This is the route's own structural copy rather than a CMS record, which is why
 * it does not pass through `canRenderEditorialText` — there is no editorial
 * document behind it to approve. Should a `pitchPage` document ever be added to
 * the content layer, this is the component that should start reading from it.
 */

import { Container, Section, TextLink } from "@/components/ui";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./pitch-page.module.css";

/** The route's own name. Matches the CTA that leads here from every page. */
export const PITCH_TITLE = "Pitch us";
export const PITCH_HEADING_ID = "pitch-heading";

export function PitchIntro() {
  return (
    <Section
      surface="dark"
      spacing="tight"
      className={styles.hero}
      aria-labelledby={PITCH_HEADING_ID}
    >
      <Container>
        <Reveal className={styles.heroInner}>
          <h1 id={PITCH_HEADING_ID} className={styles.heading}>
            {PITCH_TITLE}
          </h1>
          <p className={styles.lead}>
            Foundry is industry agnostic, embedded in the Nordics and focused on the pre-seed stage.
            If you are building an AI-native company, we would like to read about it.
          </p>
          <p className={styles.lead}>
            An idea, a working MVP or your first customers — all three are welcome.
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}

/** What happens once the form is sent. Mechanism, not marketing. */
export function PitchNextSteps({ headingId }: { headingId: string }) {
  return (
    <div className={styles.nextSteps}>
      <h2 id={headingId} className={styles.nextStepsHeading}>
        What happens after you submit
      </h2>
      <ul className={styles.nextStepsList} role="list">
        <li>Your pitch is stored and the Foundry team is notified.</li>
        <li>Anything we come back with arrives by email, at the address you give below.</li>
        <li>
          How we handle what you send is set out in the{" "}
          <TextLink href="/privacy">privacy notice</TextLink>.
        </li>
      </ul>
    </div>
  );
}
