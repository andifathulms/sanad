/**
 * Strip tashkeel (harakat) for an optional cleaner reading view.
 *
 * IMPORTANT: this is presentation-only. The original `matn_arabic` is never mutated
 * or sent anywhere — we only render a diacritic-free copy when the reader asks for it.
 * Covers the Arabic combining marks: harakat, tanwin, shadda, sukun, superscript alef,
 * and the small Quranic annotation signs.
 */
const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭ]/g;

export function stripTashkeel(text: string): string {
  return text.replace(TASHKEEL, "");
}
