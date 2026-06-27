import Link from "next/link";
import { GradeBar } from "@/components/analytics/GradeBar";
import { getGradeDistribution } from "@/lib/api/analytics";
import { getBooks } from "@/lib/api/hadith";
import type { Book, GradeDistribution } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function GradeDistributionPage() {
  let books: Book[] = [];
  let corpus: GradeDistribution | null = null;
  let perBook: { book: Book; dist: GradeDistribution }[] = [];

  try {
    [books, corpus] = await Promise.all([getBooks(), getGradeDistribution()]);
    const dists = await Promise.all(
      books.map((b) =>
        getGradeDistribution(b.slug).catch(() => null),
      ),
    );
    perBook = books
      .map((book, i) => ({ book, dist: dists[i] }))
      .filter((x): x is { book: Book; dist: GradeDistribution } => x.dist !== null);
  } catch {
    return (
      <p className="surface p-6">Grade analytics are unavailable right now.</p>
    );
  }

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-crimson text-3xl font-bold">Grade distribution</h1>
        <p className="text-sm text-ivory/60">
          How authentication grades break down across the corpus. Grades reflect
          classical scholarship as recorded in the source data — the platform
          adds none of its own.
        </p>
      </header>

      {corpus && (
        <div className="surface space-y-3 p-6">
          <h2 className="font-crimson text-xl text-amber-node">Whole corpus</h2>
          <GradeBar dist={corpus} />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="font-crimson text-xl text-amber-node">By book</h2>
        {perBook.length === 0 ? (
          <p className="text-ivory/60">No per-book grade stats available.</p>
        ) : (
          perBook.map(({ book, dist }) => (
            <div key={book.slug} className="surface space-y-3 p-5">
              <Link
                href={`/reader/${book.slug}`}
                className="font-crimson text-lg hover:text-amber-node"
              >
                {book.name_en}
              </Link>
              <GradeBar dist={dist} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
