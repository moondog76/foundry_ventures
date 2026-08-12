/**
 * Legal entity, registered address, organisation number and regulatory status.
 *
 * This is the block the audit found missing (§2.9 defect 4: `/privacy` published
 * "pending confirmation" text as if it were final). None of these values exist
 * in approved form, so the block renders nothing at all.
 *
 * That is the specified behaviour, not an oversight. §16's fallback rule is
 * explicit: missing legal approval blocks release of the affected content rather
 * than shipping draft language. The flag exists so the moment counsel approves
 * real values, one boolean and the settings fields publish the whole block —
 * and until then there is nothing here for a reader to mistake for a fact.
 *
 * Each field is rendered only when it is individually present, so a partial
 * approval publishes what is approved instead of waiting for all of it.
 */

import type { SiteSettings } from "@/content/types";
import { Container, Section } from "@/components/ui";
import styles from "./institutional-details.module.css";

export type InstitutionalDetailsProps = {
  settings: SiteSettings;
};

function formatAddress(address: SiteSettings["address"]): string | null {
  if (!address) return null;
  const parts = [
    address.streetAddress,
    [address.postalCode, address.addressLocality].filter(Boolean).join(" "),
    address.addressCountry,
  ].filter((part): part is string => Boolean(part && part.trim()));
  return parts.length > 0 ? parts.join(", ") : null;
}

export function InstitutionalDetails({ settings }: InstitutionalDetailsProps) {
  if (!settings.featureFlags.institutionalDetails) return null;

  const rows: Array<{ label: string; value: string }> = [];
  if (settings.legalName) rows.push({ label: "Legal entity", value: settings.legalName });
  if (settings.organizationNumber) {
    rows.push({ label: "Organisation number", value: settings.organizationNumber });
  }
  const address = formatAddress(settings.address);
  if (address) rows.push({ label: "Registered address", value: address });

  if (rows.length === 0) return null;

  return (
    <Section surface="light" spacing="tight" aria-labelledby="institutional-details-heading">
      <Container>
        <h2 id="institutional-details-heading" className="visually-hidden">
          Institutional details
        </h2>
        <dl className={styles.list}>
          {rows.map((row) => (
            <div key={row.label} className={styles.row}>
              <dt className={styles.label}>{row.label}</dt>
              <dd className={styles.value}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
