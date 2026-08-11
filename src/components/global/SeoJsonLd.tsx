/**
 * JSON-LD emitter (§21.3).
 *
 * The payload is serialised with `<` escaped so a CMS string can never break out
 * of the script element.
 */

import type { JsonLdObject } from "@/lib/seo/json-ld";

export function SeoJsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // The value is JSON produced above, never raw CMS markup.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
