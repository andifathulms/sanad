"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getNarratorCentrality } from "@/lib/api/analytics";
import type { CentralNarrator } from "@/lib/api/types";

/**
 * Ranked list of the most "central" narrators — the hub transmitters through
 * whom the most chains pass. Reads precomputed betweenness centrality.
 */
export function TopNarrators({ top = 10 }: { top?: number }) {
  const [narrators, setNarrators] = useState<CentralNarrator[] | null>(null);

  useEffect(() => {
    getNarratorCentrality(top)
      .then(setNarrators)
      .catch(() => setNarrators([]));
  }, [top]);

  if (!narrators || narrators.length === 0) return null;

  return (
    <div className="surface space-y-3 p-5">
      <div>
        <h2 className="font-crimson text-xl text-amber-node">Most central narrators</h2>
        <p className="text-xs text-ivory/40">
          Hub transmitters by betweenness centrality — the more chains pass
          through a narrator, the higher the score.
        </p>
      </div>
      <ol className="space-y-1">
        {narrators.map((n, i) => (
          <li key={n.id} className="flex items-center gap-3 text-sm">
            <span className="w-5 shrink-0 text-right font-mono text-ivory/40">{i + 1}</span>
            <Link href={`/narrator/${n.id}`} className="flex-1 truncate hover:text-amber-node">
              {n.name}
            </Link>
            <span className="shrink-0 text-xs text-ivory/40">
              {n.hadith_count.toLocaleString()} hadiths
            </span>
            <span className="w-16 shrink-0 text-right font-mono text-xs text-ivory/50">
              {n.centrality_score.toFixed(3)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
