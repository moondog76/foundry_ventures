/**
 * Company metadata grid (§9.1).
 *
 * Four columns on desktop, two on tablet, one on mobile. The caller passes only
 * the fields that actually cleared the publishing policy, and an empty list
 * renders nothing at all — no headings, no reserved rows, no "—" placeholders.
 */

import styles from "./company-metadata-grid.module.css";

export type CompanyMetadataItem = {
  label: string;
  value: string;
};

export function CompanyMetadataGrid({
  items,
  labelId,
}: {
  items: CompanyMetadataItem[];
  labelId?: string;
}) {
  if (items.length === 0) return null;

  return (
    <dl className={styles.grid} aria-labelledby={labelId}>
      {items.map((item) => (
        <div key={item.label} className={styles.item}>
          <dt className={styles.label}>{item.label}</dt>
          {/* Founder names and locations can be long single tokens; `anywhere`
              guarantees they wrap instead of widening the page (§19.3). */}
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
