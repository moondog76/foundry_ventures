/**
 * Statistic formatting (§7.6).
 *
 * Deliberately hand-rolled instead of `Intl.NumberFormat`: this string is
 * rendered on the server and then re-rendered on the client by the count-up, and
 * a locale- or ICU-dependent grouping character would risk a hydration mismatch.
 * The grouping is fixed to the site's language (en), which is what `<html lang>`
 * declares.
 */

export function formatStatValue(value: number): string {
  const rounded = Number.isFinite(value) ? value : 0;
  const negative = rounded < 0;
  const [integerPart, fractionPart] = Math.abs(rounded).toString().split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${grouped}${fractionPart ? `.${fractionPart}` : ""}`;
}
