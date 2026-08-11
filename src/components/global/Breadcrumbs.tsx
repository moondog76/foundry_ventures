/**
 * Breadcrumbs (§9.1, §21.3). Pairs with `breadcrumbJsonLd` so the visible trail
 * and the structured data always describe the same path.
 */

import Link from "next/link";
import styles from "./breadcrumbs.module.css";

export type Crumb = { name: string; path: string };

export function Breadcrumbs({ items, onDark = false }: { items: Crumb[]; onDark?: boolean }) {
  if (items.length === 0) return null;
  const last = items.length - 1;

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs} data-on-dark={onDark || undefined}>
      <ol className={styles.list}>
        {items.map((item, index) => (
          <li key={item.path} className={styles.item}>
            {index === last ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <>
                <Link href={item.path} className={styles.link}>
                  {item.name}
                </Link>
                <span aria-hidden="true" className={styles.separator}>
                  /
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
