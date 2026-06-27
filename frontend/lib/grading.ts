import type { Grade, Reliability } from "@/lib/api/types";

/**
 * Single source of truth for the grading + reliability palette and labels.
 *
 * Colour semantics are deliberately ordered to mirror the *scholarly* hierarchy,
 * not a generic traffic-light. Orange/amber is reserved for "weak but not rejected"
 * (da'if narrations are still used by many scholars for fada'il al-a'mal), and the
 * strongest alarm colour (purple) is reserved for fabrication (maudu' / matruk):
 *
 *   green  → authentic / fully reliable      (sahih, thiqah)
 *   teal   → acceptable / truthful           (hasan, saduq)   — NOT a warning hue
 *   amber  → weak, handle with care          (daif)
 *   purple → fabricated / abandoned          (maudu, matruk)  — the real danger
 *   slate  → no scholarly assessment on file (unknown, majhul)
 *
 * These hex values are mirrored verbatim in tailwind.config.ts (grade.* / reliability.*)
 * and must stay in sync with the backend graph palette.
 */
export const GRADE_COLORS: Record<Grade, string> = {
  sahih: "#27AE60", // emerald — authentic
  hasan: "#2D9C8F", // teal — acceptable (distinct from any warning hue)
  daif: "#E08A2E", // amber — weak, not rejected
  maudu: "#8E44AD", // purple — fabricated
  unknown: "#7F8C8D", // slate — not assessed
};

export const GRADE_LABELS: Record<Grade, string> = {
  sahih: "Sahih",
  hasan: "Hasan",
  daif: "Da'if",
  maudu: "Maudu'",
  unknown: "Unknown",
};

/** Short, colour-independent marker so grade is legible without relying on hue. */
export const GRADE_ABBR: Record<Grade, string> = {
  sahih: "S",
  hasan: "H",
  daif: "D",
  maudu: "!",
  unknown: "?",
};

export const RELIABILITY_COLORS: Record<Reliability, string> = {
  thiqah: "#27AE60", // emerald — reliable
  saduq: "#2D9C8F", // teal — truthful
  daif: "#E08A2E", // amber — weak
  majhul: "#7F8C8D", // slate — unknown narrator
  matruk: "#8E44AD", // purple — abandoned
  unknown: "#95A5A6", // light slate — not yet assessed
};

export const RELIABILITY_LABELS: Record<Reliability, string> = {
  thiqah: "Thiqah (Reliable)",
  saduq: "Saduq (Truthful)",
  daif: "Da'if (Weak)",
  majhul: "Majhul (Unknown narrator)",
  matruk: "Matruk (Abandoned)",
  unknown: "Not yet assessed",
};

/** Short, colour-independent marker for narrator reliability. */
export const RELIABILITY_ABBR: Record<Reliability, string> = {
  thiqah: "Th",
  saduq: "Sd",
  daif: "Ḍa",
  majhul: "Mj",
  matruk: "Mt",
  unknown: "—",
};

/** "unknown" is the absence of an assessment in our data — not a scholarly verdict. */
export const isAssessed = (r: Reliability) => r !== "unknown";
