import Link from "next/link";
import { getBooks } from "@/lib/api/hadith";
import { ContinueReading } from "@/components/reader/ContinueReading";
import type { Book } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function ReaderHome() {
  let books: Book[] = [];
  let error = false;
  try {
    books = await getBooks();
  } catch {
    error = true;
  }

  return (
    <section className="space-y-6">
      <h1 className="font-crimson text-3xl font-bold">Hadith Collections</h1>
      <ContinueReading />
      {error && (
        <p className="surface p-4 text-ivory/70">
          Could not reach the corpus API. Start the backend and run the ingestion
          pipeline (see README).
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <Link key={book.id} href={`/reader/${book.slug}`} className="surface p-5 hover:border-amber-node/40">
            <p className="arabic text-2xl text-amber-node">{book.name_arabic}</p>
            <h2 className="mt-1 font-crimson text-xl">{book.name_en}</h2>
            <p className="text-sm text-ivory/60">{book.author}</p>
            <p className="mt-2 font-mono text-xs text-ivory/40">
              {book.total_hadiths.toLocaleString()} hadiths · {book.collection_type}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
