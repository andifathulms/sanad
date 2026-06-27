import Link from "next/link";
import { getHadith, getSanad } from "@/lib/api/hadith";
import { BookmarkButton } from "@/components/reader/BookmarkButton";
import { GradeBadge } from "@/components/reader/GradeBadge";
import { SanadInline } from "@/components/reader/SanadInline";
import { ParallelNarrations } from "@/components/analytics/ParallelNarrations";
import { RecordHistory } from "@/components/reader/RecordHistory";
import type { HadithDetail, SanadResponse } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function HadithDetailPage({
  params,
}: {
  params: { book: string; hadith: string };
}) {
  let hadith: HadithDetail;
  let sanad: SanadResponse = { chain: [], graph_data: { nodes: [], edges: [] } };
  try {
    hadith = await getHadith(params.hadith);
    try {
      sanad = await getSanad(params.hadith);
    } catch {
      /* chain optional */
    }
  } catch {
    return <p className="surface p-4">Hadith not found or API unavailable.</p>;
  }

  return (
    <article className="space-y-6">
      <RecordHistory hadithId={hadith.id} />
      <Link href={`/reader/${params.book}`} className="text-sm text-ivory/60 hover:text-amber-node">
        ← {hadith.book.name_en}
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-ivory/60">{hadith.global_reference}</p>
          {hadith.alt_reference && (
            <p className="font-mono text-xs text-ivory/40">also: {hadith.alt_reference}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <BookmarkButton hadithId={hadith.id} />
          <GradeBadge grade={hadith.grade} source={hadith.grade_source} />
        </div>
      </header>

      {hadith.grade === "maudu" && (
        <div className="rounded-lg border border-grade-maudu/40 bg-grade-maudu/10 p-4 text-grade-maudu">
          ⚠ This narration is classified as <strong>Maudu&apos; (fabricated)</strong> according
          to {hadith.grade_source || "classical scholars"}.
        </div>
      )}
      {hadith.grade === "daif" && (
        <div className="rounded-lg border border-grade-daif/40 bg-grade-daif/10 p-4 text-grade-daif">
          This narration is considered weak (Da&apos;if).
        </div>
      )}

      <div className="surface p-6">
        <p className="arabic text-3xl">{hadith.matn_arabic}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {hadith.translation_en && (
          <div className="surface p-5">
            <h3 className="mb-2 font-crimson text-amber-node">English</h3>
            <p className="text-ivory/85">{hadith.translation_en}</p>
          </div>
        )}
        <div className="surface p-5">
          <h3 className="mb-2 font-crimson text-amber-node">Indonesian</h3>
          {hadith.translation_id ? (
            <p className="text-ivory/85">{hadith.translation_id}</p>
          ) : (
            <p className="text-sm text-ivory/40">Indonesian translation not yet available.</p>
          )}
        </div>
      </div>

      <div className="surface p-6">
        <SanadInline chain={sanad.chain} hadithId={hadith.id} />
      </div>

      <ParallelNarrations hadithId={hadith.id} />

      {hadith.grade_notes && (
        <p className="text-sm text-ivory/60">
          <span className="text-ivory/40">Grading notes: </span>
          {hadith.grade_notes}
        </p>
      )}
    </article>
  );
}
