import Link from "next/link";
import type { HadithListItem } from "@/lib/api/types";
import { GradeBadge } from "./GradeBadge";
import { MatnDisplay } from "./MatnDisplay";
import { CardTranslation } from "./CardTranslation";

/**
 * Reader card. Arabic matn is rendered in full (never truncated/altered) and the
 * grade badge is always present. Da'if/Maudu' narrations carry a visible warning.
 */
export function HadithCard({ hadith }: { hadith: HadithListItem }) {
  return (
    <article className="surface space-y-4 p-6">
      <header className="flex items-center justify-between">
        <Link
          href={`/reader/${hadith.book_slug}/${hadith.id}`}
          className="font-mono text-sm text-ivory/60 hover:text-amber-node"
        >
          {hadith.global_reference}
        </Link>
        <GradeBadge grade={hadith.grade} source={hadith.grade_source} />
      </header>

      {hadith.grade === "maudu" && (
        <div className="rounded-lg border border-grade-maudu/40 bg-grade-maudu/10 p-3 text-sm text-grade-maudu">
          ⚠ This narration is classified as <strong>Maudu&apos; (fabricated)</strong>.
        </div>
      )}
      {hadith.grade === "daif" && (
        <div className="rounded-lg border border-grade-daif/40 bg-grade-daif/10 p-3 text-sm text-grade-daif">
          This narration is considered weak (Da&apos;if).
        </div>
      )}

      <MatnDisplay arabic={hadith.matn_arabic} baseRem={1.5} bare />

      <CardTranslation en={hadith.translation_en} id={hadith.translation_id} />
    </article>
  );
}
