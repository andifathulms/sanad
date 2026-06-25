import Link from "next/link";
import { getBook, getBookHadiths, getChapters } from "@/lib/api/hadith";
import { HadithCard } from "@/components/reader/HadithCard";
import type { Book, Chapter, HadithListItem } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params,
  searchParams,
}: {
  params: { book: string };
  searchParams: { chapter?: string; page?: string };
}) {
  const chapterNo = searchParams.chapter ? Number(searchParams.chapter) : undefined;
  let book: Book | null = null;
  let chapters: Chapter[] = [];
  let hadiths: HadithListItem[] = [];
  try {
    [book, chapters] = await Promise.all([
      getBook(params.book),
      getChapters(params.book),
    ]);
    const page = await getBookHadiths(params.book, {
      chapter: chapterNo,
      page: searchParams.page ? Number(searchParams.page) : 1,
    });
    hadiths = page.results;
  } catch {
    return <p className="surface p-4">Book not found or API unavailable.</p>;
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-2">
        <Link href="/reader" className="text-sm text-ivory/60 hover:text-amber-node">
          ← All collections
        </Link>
        <p className="arabic text-2xl text-amber-node">{book.name_arabic}</p>
        <h1 className="font-crimson text-2xl">{book.name_en}</h1>
        <nav className="mt-4 max-h-[70vh] space-y-1 overflow-y-auto pr-2 text-sm">
          {chapters.map((ch) => (
            <Link
              key={ch.id}
              href={`/reader/${params.book}?chapter=${ch.number}`}
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
        {hadiths.map((h) => (
          <HadithCard key={h.id} hadith={h} />
        ))}
        {!hadiths.length && (
          <p className="surface p-4 text-ivory/60">No hadiths to display yet.</p>
        )}
      </div>
    </section>
  );
}
