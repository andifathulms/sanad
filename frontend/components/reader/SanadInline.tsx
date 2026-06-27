import Link from "next/link";
import type { ChainNarrator } from "@/lib/api/types";
import { NarratorChip } from "./NarratorChip";

/**
 * Compact chain shown inside the reader: a horizontal scroll of NarratorChips,
 * ordered from the Prophet ﷺ (position 1) down to the collector. A "View full
 * chain" link opens the full-screen isnad graph.
 */
export function SanadInline({
  chain,
  hadithId,
}: {
  chain: ChainNarrator[];
  hadithId: number;
}) {
  if (!chain.length) {
    return (
      <p className="text-sm text-ivory/50">Chain data not yet available for this hadith.</p>
    );
  }
  const ordered = [...chain].sort((a, b) => a.position - b.position);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-crimson text-lg text-amber-node">Isnad (Chain)</h3>
        <Link href={`/isnad/${hadithId}`} className="text-sm text-ivory/70 hover:text-amber-node">
          View full chain →
        </Link>
      </div>
      <p className="text-xs text-ivory/40">
        Read left to right: Prophet&nbsp;ﷺ&nbsp;→&nbsp;…&nbsp;→&nbsp;collector. The glyph on
        each narrator marks their reliability grade.
      </p>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {ordered.map((link, i) => (
          <div key={link.narrator.id} className="flex items-center gap-2">
            <NarratorChip narrator={link.narrator} />
            {i < ordered.length - 1 && <span className="text-ivory/30">→</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
