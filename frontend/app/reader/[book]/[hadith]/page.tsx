import Link from "next/link";
import { getHadith, getHadithNeighbors, getSanad, type HadithNeighborRef } from "@/lib/api/hadith";
import { HadithPager } from "@/components/reader/HadithPager";
import { BookmarkButton } from "@/components/reader/BookmarkButton";
import { GradeBadge } from "@/components/reader/GradeBadge";
import { ScholarGradings, scholarsDiffer } from "@/components/reader/ScholarGradings";
import { SanadInline } from "@/components/reader/SanadInline";
import { MatnDisplay } from "@/components/reader/MatnDisplay";
import { Translations } from "@/components/reader/Translations";
import { ChainProvenance } from "@/components/isnad/ChainProvenance";
import { QuranRefs } from "@/components/reader/QuranRefs";
import { ShareHadithCard } from "@/components/reader/ShareHadithCard";
import { ParallelNarrations } from "@/components/analytics/ParallelNarrations";
import { RecordHistory } from "@/components/reader/RecordHistory";
import { StudyTabs, type StudyTab } from "@/components/reader/StudyTabs";
import { FocusMode } from "@/components/reader/FocusMode";
import { getMutabiShahid } from "@/lib/api/analytics";
import type { HadithDetail, SanadResponse } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function HadithDetailPage({
  params,
}: {
  params: { book: string; hadith: string };
}) {
  let hadith: HadithDetail;
  let sanad: SanadResponse = { chain: [], graph_data: { nodes: [], edges: [] } };
  let neighbors: { prev: HadithNeighborRef | null; next: HadithNeighborRef | null } = {
    prev: null,
    next: null,
  };
  try {
    hadith = await getHadith(params.hadith);
    try {
      sanad = await getSanad(params.hadith);
    } catch {
      /* chain optional */
    }
    try {
      neighbors = await getHadithNeighbors(params.hadith);
    } catch {
      /* neighbors optional */
    }
  } catch {
    return <p className="surface p-4">Hadith not found or API unavailable.</p>;
  }

  let hasParallels = false;
  try {
    const mp = await getMutabiShahid(hadith.id);
    hasParallels = (mp.mutabi?.length ?? 0) + (mp.shahid?.length ?? 0) > 0;
  } catch {
    /* analytics optional */
  }

  const pagerTarget = (n: HadithNeighborRef | null) =>
    n ? { href: `/reader/${n.book_slug}/${n.id}`, label: n.global_reference } : null;

  // Analytical panels live behind tabs so the reading surface stays focused.
  // Tabs only appear when they have something to show.
  const studyTabs: StudyTab[] = [
    {
      key: "chain",
      label: "Chain",
      content: (
        <div className="surface space-y-4 p-6">
          <SanadInline chain={sanad.chain} hadithId={hadith.id} />
          <ChainProvenance chainType={hadith.chain_type} />
        </div>
      ),
    },
  ];
  if (hadith.gradings.length > 0) {
    studyTabs.push({
      key: "gradings",
      label: "Scholarly grading",
      content: <ScholarGradings gradings={hadith.gradings} />,
    });
  }
  if (hadith.quran_refs.length > 0) {
    studyTabs.push({
      key: "quran",
      label: "Qur'an links",
      content: <QuranRefs refs={hadith.quran_refs} />,
    });
  }
  if (hasParallels) {
    studyTabs.push({
      key: "parallels",
      label: "Parallels",
      content: <ParallelNarrations hadithId={hadith.id} />,
    });
  }
  studyTabs.push({
    key: "share",
    label: "Share",
    content: (
      <ShareHadithCard
        arabic={hadith.matn_arabic}
        translation={hadith.translation_en || hadith.translation_id}
        reference={hadith.global_reference}
        grade={hadith.grade}
        source={hadith.grade_source}
      />
    ),
  });

  return (
    <article className="space-y-6">
      <RecordHistory hadithId={hadith.id} />
      <FocusMode />

      <nav
        data-focus-hide
        className="flex flex-wrap items-center gap-1.5 text-sm text-ivory/50"
        aria-label="Breadcrumb"
      >
        <Link href="/reader" className="hover:text-amber-node">Reader</Link>
        <span className="text-ivory/25">/</span>
        <Link href={`/reader/${params.book}`} className="hover:text-amber-node">
          {hadith.book.name_en}
        </Link>
        {hadith.chapter && (
          <>
            <span className="text-ivory/25">/</span>
            <Link
              href={`/reader/${params.book}?chapter=${hadith.chapter.number}`}
              className="hover:text-amber-node"
            >
              {hadith.chapter.title_en}
            </Link>
          </>
        )}
        <span className="text-ivory/25">/</span>
        <span className="text-ivory/70">
          Hadith {hadith.number_in_book.toLocaleString()} of{" "}
          {hadith.book.total_hadiths.toLocaleString()}
        </span>
      </nav>

      <div data-focus-hide>
        <HadithPager prev={pagerTarget(neighbors.prev)} next={pagerTarget(neighbors.next)} />
      </div>

      <header data-focus-hide className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-ivory/60">{hadith.global_reference}</p>
          {hadith.alt_reference && (
            <p className="font-mono text-xs text-ivory/40">also: {hadith.alt_reference}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <BookmarkButton hadithId={hadith.id} />
          <GradeBadge grade={hadith.grade} source={hadith.grade_source} />
          {scholarsDiffer(hadith.gradings) && (
            <span className="rounded-full bg-grade-hasan/15 px-2.5 py-0.5 text-xs text-grade-hasan">
              Scholars differ
            </span>
          )}
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

      <MatnDisplay arabic={hadith.matn_arabic} baseRem={1.875} />

      <Translations en={hadith.translation_en} id={hadith.translation_id} />

      {hadith.grade_notes && (
        <p className="max-w-[68ch] text-sm text-ivory/60">
          <span className="text-ivory/40">Grading notes: </span>
          {hadith.grade_notes}
        </p>
      )}

      <div data-focus-hide>
        <StudyTabs tabs={studyTabs} />
      </div>

      <HadithPager prev={pagerTarget(neighbors.prev)} next={pagerTarget(neighbors.next)} />
    </article>
  );
}
