const EASTERN_ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Formats a non-negative integer using the numeral set for the given locale.
 * - 'en': Western Arabic digits (0–9)
 * - 'ar': Eastern Arabic digits (٠–٩)
 *
 * Applies to UI chrome values (scores, counts, round numbers) only.
 * Card face values are excluded from this formatter.
 */
export function formatNumber(value: number, locale: 'en' | 'ar'): string {
  const str = String(value);
  if (locale === 'en') return str;
  return str.replace(/[0-9]/g, digit => EASTERN_ARABIC_DIGITS[parseInt(digit, 10)]);
}
