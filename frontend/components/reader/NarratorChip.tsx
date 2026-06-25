import Link from "next/link";
import type { Narrator, Reliability } from "@/lib/api/types";

export const RELIABILITY_COLORS: Record<Reliability, string> = {
  thiqah: "#27AE60",
  saduq: "#F39C12",
  daif: "#E74C3C",
  majhul: "#7F8C8D",
  matruk: "#8E44AD",
  unknown: "#95A5A6",
};

/**
 * A clickable narrator in a chain: Arabic name + a colored reliability dot.
 * Links to the narrator profile (the slide-over drawer lands in Phase 2).
 */
export function NarratorChip({ narrator }: { narrator: Narrator }) {
  const color = RELIABILITY_COLORS[narrator.reliability_grade];
  return (
    <Link
      href={`/narrator/${narrator.id}`}
      title={`${narrator.name_transliteration} — ${narrator.reliability_grade}`}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-indigo-navy px-3 py-2 hover:border-amber-node/50"
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="arabic text-base">{narrator.name_arabic}</span>
    </Link>
  );
}
