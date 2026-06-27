"use client";

import Link from "next/link";
import type { Narrator } from "@/lib/api/types";
import {
  RELIABILITY_ABBR,
  RELIABILITY_COLORS,
  RELIABILITY_LABELS,
  isAssessed,
} from "@/lib/grading";
import { honorificFor } from "@/lib/honorifics";
import { useReaderSettings } from "@/lib/hooks/useReaderSettings";

// Re-exported for components that already import the palette from here.
export { RELIABILITY_COLORS, RELIABILITY_LABELS, isAssessed };

/**
 * A clickable narrator in a chain: Arabic name + a colored reliability dot, with an
 * optional classical honorific (RA / rah.) the reader can toggle in settings.
 * Links to the narrator profile (the slide-over drawer lands in Phase 2).
 */
export function NarratorChip({ narrator }: { narrator: Narrator }) {
  const { showHonorifics } = useReaderSettings();
  const color = RELIABILITY_COLORS[narrator.reliability_grade];
  const honorific = showHonorifics ? honorificFor(narrator.generation) : null;
  return (
    <Link
      href={`/narrator/${narrator.id}`}
      title={`${narrator.name_transliteration} — ${RELIABILITY_LABELS[narrator.reliability_grade]}`}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-indigo-navy px-3 py-2 hover:border-amber-node/50"
    >
      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-bold leading-none text-indigo-deep"
        style={{ backgroundColor: color }}
        aria-hidden
      >
        {RELIABILITY_ABBR[narrator.reliability_grade]}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="arabic text-base">{narrator.name_arabic}</span>
        {narrator.name_transliteration && (
          <span className="text-xs text-ivory/50">
            {narrator.name_transliteration}
            {honorific && (
              <span className="ml-1 text-amber-node/70" title={honorific.full}>
                {honorific.abbr}
              </span>
            )}
          </span>
        )}
      </span>
    </Link>
  );
}
