"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { getBooks, searchHadiths } from "@/lib/api/hadith";
import { GradeBadge } from "@/components/reader/GradeBadge";
import { GRADE_LABELS } from "@/lib/grading";
import type { Book, Grade, HadithListItem } from "@/lib/api/types";

type Lang = "ar" | "en" | "id";

const GRADES: Grade[] = ["sahih", "hasan", "daif", "maudu", "unknown"];

const SUGGESTIONS: Record<Lang, string[]> = {
  en: ["intention", "mercy", "prayer", "knowledge", "patience"],
  id: ["niat", "shalat", "ilmu", "sabar", "surga"],
  ar: ["النية", "الصلاة", "العلم", "الصبر", "الرحمة"],
};

/** Wrap every case-insensitive occurrence of `query` in the text with a highlight. */
function highlight(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const out: ReactNode[] = [];
  let from = 0;
  let idx = lower.indexOf(needle, from);
  if (idx === -1) return text;
  let key = 0;
  while (idx !== -1) {
    if (idx > from) out.push(text.slice(from, idx));
    out.push(
      <mark key={key++} className="rounded bg-amber-node/30 px-0.5 text-ivory">
        {text.slice(idx, idx + q.length)}
      </mark>,
    );
    from = idx + q.length;
    idx = lower.indexOf(needle, from);
  }
  if (from < text.length) out.push(text.slice(from));
  return out;
}

/** Crop a window around the first match so results scan as snippets, not walls of text. */
function snippet(text: string, query: string, radius = 140): string {
  if (!text) return "";
  const i = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (i === -1) return text.length > radius * 2 ? `${text.slice(0, radius * 2)}…` : text;
  const start = Math.max(0, i - radius);
  const end = Math.min(text.length, i + query.length + radius);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

function ResultCard({ h, q, lang }: { h: HadithListItem; q: string; lang: Lang }) {
  const field =
    lang === "ar"
      ? h.matn_arabic
      : lang === "id"
        ? h.translation_id || h.translation_en
        : h.translation_en || h.translation_id;
  const snip = snippet(field, q);
  return (
    <article className="surface space-y-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/reader/${h.book_slug}/${h.id}`}
          className="font-mono text-sm text-ivory/70 hover:text-amber-node"
        >
          {h.global_reference}
        </Link>
        <GradeBadge grade={h.grade} source={h.grade_source} />
      </div>
      <p className={lang === "ar" ? "arabic text-xl" : "max-w-[72ch] leading-relaxed text-ivory/85"}>
        {highlight(snip, q)}
      </p>
    </article>
  );
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [book, setBook] = useState("");
  const [grade, setGrade] = useState("");
  const [books, setBooks] = useState<Book[]>([]);

  const [results, setResults] = useState<HadithListItem[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [activeQ, setActiveQ] = useState(""); // the query the visible results belong to
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    getBooks()
      .then(setBooks)
      .catch(() => undefined);
  }, []);

  async function run(term: string, toPage: number) {
    const query = term.trim();
    if (!query) return;
    setLoading(true);
    setError(false);
    try {
      const res = await searchHadiths({
        q: query,
        lang,
        book: book || undefined,
        grade: grade || undefined,
        page: toPage,
      });
      setResults(res.results);
      setCount(res.count);
      setHasNext(Boolean(res.next));
      setPage(toPage);
      setActiveQ(query);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    run(q, 1);
  }

  const PAGE_SIZE = 20;
  const totalPages = count ? Math.max(1, Math.ceil(count / PAGE_SIZE)) : 1;

  return (
    <section className="space-y-6">
      <h1 className="font-crimson text-3xl font-bold">Search the Corpus</h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={lang === "ar" ? "ابحث في المتن…" : "Search hadith text…"}
            dir={lang === "ar" ? "rtl" : "ltr"}
            className={`flex-1 rounded-lg border border-white/10 bg-indigo-navy px-4 py-2 outline-none focus:border-amber-node ${
              lang === "ar" ? "arabic text-lg" : ""
            }`}
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-scholar px-6 py-2 font-medium hover:bg-indigo-scholar/80"
          >
            Search
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="rounded-lg border border-white/10 bg-indigo-navy px-3 py-2"
          >
            <option value="en">English</option>
            <option value="id">Indonesian</option>
            <option value="ar">Arabic</option>
          </select>
          <select
            value={book}
            onChange={(e) => setBook(e.target.value)}
            className="rounded-lg border border-white/10 bg-indigo-navy px-3 py-2"
          >
            <option value="">All books</option>
            {books.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name_en}
              </option>
            ))}
          </select>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="rounded-lg border border-white/10 bg-indigo-navy px-3 py-2"
          >
            <option value="">Any grade</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {GRADE_LABELS[g]}
              </option>
            ))}
          </select>
        </div>
      </form>

      {/* Empty-state suggestions so search doesn't start as a blank box. */}
      {count === null && !loading && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ivory/40">Try:</span>
          {SUGGESTIONS[lang].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQ(s);
                run(s, 1);
              }}
              className={`rounded-full border border-white/10 bg-indigo-navy px-3 py-1 text-sm hover:border-amber-node/50 ${
                lang === "ar" ? "arabic" : ""
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-ivory/60">Searching…</p>}
      {error && <p className="surface p-4 text-grade-daif">Search failed — is the API running?</p>}
      {count !== null && !loading && (
        <p className="text-sm text-ivory/50">{count.toLocaleString()} result(s)</p>
      )}

      <div className="space-y-3">
        {results.map((h) => (
          <ResultCard key={h.id} h={h} q={activeQ} lang={lang} />
        ))}
      </div>

      {count !== null && count > PAGE_SIZE && !loading && (
        <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Pagination">
          <button
            onClick={() => run(activeQ, page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-white/10 bg-indigo-navy px-4 py-2 disabled:opacity-30"
          >
            ← Previous
          </button>
          <span className="text-ivory/50">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => run(activeQ, page + 1)}
            disabled={!hasNext}
            className="rounded-lg border border-white/10 bg-indigo-navy px-4 py-2 disabled:opacity-30"
          >
            Next →
          </button>
        </nav>
      )}
    </section>
  );
}
