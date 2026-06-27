import Link from "next/link";
import { RELIABILITY_COLORS, RELIABILITY_LABELS } from "@/components/reader/NarratorChip";
import type { Narrator } from "@/lib/api/types";

const GENERATION_LABELS: Record<string, string> = {
  sahabi: "Sahabi",
  tabii: "Tabi'i",
  taba_tabii: "Tabi' al-Tabi'in",
  later: "Later",
  collector: "Collector",
  unknown: "Unknown generation",
};

/** Compact narrator card used in search results and teacher/student lists. */
export function NarratorListCard({ narrator }: { narrator: Narrator }) {
  const color = RELIABILITY_COLORS[narrator.reliability_grade];
  return (
    <Link
      href={`/narrator/${narrator.id}`}
      className="surface flex items-center justify-between p-4 hover:border-amber-node/40"
    >
      <div className="min-w-0">
        <p className="arabic truncate text-xl text-amber-node">{narrator.name_arabic}</p>
        {narrator.name_transliteration && (
          <p className="truncate text-sm text-ivory/80">{narrator.name_transliteration}</p>
        )}
        <p className="text-xs text-ivory/50">
          {GENERATION_LABELS[narrator.generation] ?? narrator.generation}
          {narrator.death_year_ah ? ` · d. ${narrator.death_year_ah} AH` : ""}
          {narrator.total_hadiths ? ` · ${narrator.total_hadiths} hadiths` : ""}
        </p>
      </div>
      <span
        className="ml-3 h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        title={RELIABILITY_LABELS[narrator.reliability_grade]}
      />
    </Link>
  );
}
