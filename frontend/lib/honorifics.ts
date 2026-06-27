/**
 * Classical honorifics (adab) for narrators, keyed by generation.
 *
 * - Companions (sahaba): radiyallahu 'anhu — "(RA)"
 * - Later narrators (tabi'in onward): rahimahullah — "(rah.)"
 *
 * We only know generation, not gender, so the English abbreviation is used
 * (gender-neutral in practice) rather than a gendered Arabic vocalisation that
 * could be wrong for the female companions. The Prophet's ﷺ is handled separately
 * and is never reduced to an abbreviation.
 */
export interface Honorific {
  abbr: string;
  full: string;
}

const RA: Honorific = { abbr: "(RA)", full: "raḍiyallāhu ʿanhu/hā" };
const RAH: Honorific = { abbr: "(rah.)", full: "raḥimahullāh" };

export function honorificFor(generation: string): Honorific | null {
  switch (generation) {
    case "sahabi":
      return RA;
    case "tabii":
    case "taba_tabii":
    case "later":
    case "collector":
      return RAH;
    default:
      return null; // unknown generation — no honorific asserted
  }
}
