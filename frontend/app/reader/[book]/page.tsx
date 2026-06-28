import Link from "next/link";
import { getBook, getBookHadiths, getChapters } from "@/lib/api/hadith";
import { HadithCard } from "@/components/reader/HadithCard";
import { GRADE_LABELS } from "@/lib/grading";
import type { Book, Chapter, Grade, HadithListItem } from "@/lib/api/types";

export const dynamic = "force-dynamic";

const GRADE_FILTERS: Grade[] = ["sahih", "hasan", "daif", "maudu", "unknown"];

export default async function BookPage({
  params,
  searchParams,
}: {
  params: { book: string };
  searchParams: { chapter?: string; page?: string; grade?: string };
}) {
  const PAGE_SIZE = 20; // CLAUDE.md: max 20 hadiths per page
  const chapterNo = searchParams.chapter ? Number(searchParams.chapter) : undefined;
  const grade = searchParams.grade;
  const currentPage = searchParams.page ? Math.max(1, Number(searchParams.page)) : 1;
  let book: Book | null = null;
  let chapters: Chapter[] = [];
  let hadiths: HadithListItem[] = [];
  let totalCount = 0;
  let hasNext = false;
  try {
    [book, chapters] = await Promise.all([
      getBook(params.book),
      getChapters(params.book),
    ]);
    const page = await getBookHadiths(params.book, {
      chapter: chapterNo,
      grade,
      page: currentPage,
    });
    hadiths = page.results;
    totalCount = page.count;
    hasNext = Boolean(page.next);
  } catch {
    return <p className="surface p-4">Book not found or API unavailable.</p>;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Build a hadiths-list href that keeps the active chapter and toggles grade.
  // Changing chapter/grade resets to page 1.
  const hrefWithGrade = (g?: Grade) => {
    const sp = new URLSearchParams();
    if (chapterNo) sp.set("chapter", String(chapterNo));
    if (g) sp.set("grade", g);
    const qs = sp.toString();
    return `/reader/${params.book}${qs ? `?${qs}` : ""}`;
  };

  // Build a href that keeps chapter/grade and moves to a specific page.
  const hrefWithPage = (p: number) => {
    const sp = new URLSearchParams();
    if (chapterNo) sp.set("chapter", String(chapterNo));
    if (grade) sp.set("grade", grade);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/reader/${params.book}${qs ? `?${qs}` : ""}`;
  };

  return (
    <section className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-2 lg:sticky lg:top-6 lg:self-start">
        <Link href="/reader" className="text-sm text-ivory/60 hover:text-amber-node">
          ← All collections
        </Link>
        <p className="arabic text-2xl text-amber-node">{book.name_arabic}</p>
        <h1 className="font-crimson text-2xl">{book.name_en}</h1>
        <nav className="mt-4 max-h-[calc(100vh-12rem)] space-y-1 overflow-y-auto pr-2 text-sm">
          {chapters.map((ch) => (
            <Link
              key={ch.id}
              href={`/reader/${params.book}?chapter=${ch.number}${grade ? `&grade=${grade}` : ""}`}
              className={`block rounded px-2 py-1 hover:bg-indigo-navy ${
                chapterNo === ch.number ? "bg-indigo-navy text-amber-node" : "text-ivory/70"
              }`}
            >
              {ch.number}. {ch.title_en}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-ivory/40">Grade:</span>
          <Link
            href={hrefWithGrade(undefined)}
            className={`rounded-full px-3 py-1 ${
              !grade ? "bg-indigo-scholar text-ivory" : "bg-indigo-navy text-ivory/70 hover:text-amber-node"
            }`}
          >
            All
          </Link>
          {GRADE_FILTERS.map((g) => (
            <Link
              key={g}
              href={hrefWithGrade(g)}
              className={`rounded-full px-3 py-1 ${
                grade === g ? "bg-indigo-scholar text-ivory" : "bg-indigo-navy text-ivory/70 hover:text-amber-node"
              }`}
            >
              {GRADE_LABELS[g]}
            </Link>
          ))}
        </div>

        {hadiths.map((h) => (
          <HadithCard key={h.id} hadith={h} />
        ))}
        {!hadiths.length && (
          <p className="surface p-4 text-ivory/60">No hadiths to display yet.</p>
        )}

        {totalCount > PAGE_SIZE && (
          <nav className="flex items-center justify-between gap-3 pt-2 text-sm" aria-label="Pagination">
            {currentPage > 1 ? (
              <Link
                href={hrefWithPage(currentPage - 1)}
                rel="prev"
                className="rounded-lg border border-white/10 bg-indigo-navy px-4 py-2 hover:border-amber-node/50"
              >
                ← Previous
              </Link>
            ) : (
              <span className="rounded-lg border border-white/5 px-4 py-2 text-ivory/30">
                ← Previous
              </span>
            )}

            <span className="text-ivory/50">
              Page {currentPage} of {totalPages}{" "}
              <span className="text-ivory/30">· {totalCount.toLocaleString()} hadiths</span>
            </span>

            {hasNext ? (
              <Link
                href={hrefWithPage(currentPage + 1)}
                rel="next"
                className="rounded-lg border border-white/10 bg-indigo-navy px-4 py-2 hover:border-amber-node/50"
              >
                Next →
              </Link>
            ) : (
              <span className="rounded-lg border border-white/5 px-4 py-2 text-ivory/30">
                Next →
              </span>
            )}
          </nav>
        )}
      </div>
    </section>
  );
}
