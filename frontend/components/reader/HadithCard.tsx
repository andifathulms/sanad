import Link from "next/link";
import type { HadithListItem } from "@/lib/api/types";
import { GradeBadge } from "./GradeBadge";

/**
 * Reader card. Arabic matn is rendered in full (never truncated/altered) and the
 * grade badge is always present. Da'if/Maudu' narrations carry a visible warning.
 */
export function HadithCard({ hadith }: { hadith: HadithListItem }) {
  const translation = hadith.translation_id || hadith.translation_en;
  const usingFallback = !hadith.translation_id && !!hadith.translation_en;

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

      <p className="arabic text-2xl">{hadith.matn_arabic}</p>

      {translation && (
        <div className="border-t border-white/5 pt-3 text-ivory/80">
          <p>{translation}</p>
          {usingFallback && (
            <p className="mt-1 text-xs text-ivory/40">
              Indonesian translation not yet available — showing English.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
