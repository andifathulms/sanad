"use client";

import Link from "next/link";
import { useState } from "react";
import { getWordFrequency } from "@/lib/api/analytics";
import type { WordFrequency } from "@/lib/api/types";

/** Common starting points so users aren't faced with a blank Arabic box. */
const SUGGESTIONS: { ar: string; en: string }[] = [
  { ar: "الله", en: "Allah" },
  { ar: "الصلاة", en: "prayer" },
  { ar: "النية", en: "intention" },
  { ar: "العلم", en: "knowledge" },
  { ar: "الصبر", en: "patience" },
  { ar: "الجنة", en: "paradise" },
  { ar: "النار", en: "the Fire" },
  { ar: "الإيمان", en: "faith" },
  { ar: "الزكاة", en: "zakat" },
  { ar: "الصوم", en: "fasting" },
];

export default function WordFrequencyPage() {
  const [word, setWord] = useState("");
  const [result, setResult] = useState<WordFrequency | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function runLookup(w: string) {
    const term = w.trim();
    if (!term) return;
    setLoading(true);
    setError(false);
    try {
      setResult(await getWordFrequency(term));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runLookup(word);
  }

  const maxCount = result
    ? Math.max(1, ...result.per_book.map((b) => b.count))
    : 1;

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-crimson text-3xl font-bold">Arabic word frequency</h1>
        <p className="text-sm text-ivory/60">
          How often an <strong>Arabic</strong> word appears in the matn across the corpus,
          by book — tashkeel-insensitive, so type it however you like. Looking for an
          English or Indonesian word?{" "}
          <Link href="/search" className="text-amber-node hover:underline">
            Use Search
          </Link>{" "}
          instead.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-wrap gap-3">
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="أدخل كلمة…"
          dir="rtl"
          className="arabic flex-1 rounded-lg border border-white/10 bg-indigo-navy px-4 py-2 text-lg outline-none focus:border-amber-node"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-scholar px-6 py-2 font-medium hover:bg-indigo-scholar/80"
        >
          Count
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-ivory/40">Try:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s.ar}
            type="button"
            onClick={() => {
              setWord(s.ar);
              runLookup(s.ar);
            }}
            className="group flex items-center gap-1.5 rounded-full border border-white/10 bg-indigo-navy px-3 py-1 hover:border-amber-node/50"
          >
            <span className="arabic text-base">{s.ar}</span>
            <span className="text-xs text-ivory/40 group-hover:text-ivory/60">{s.en}</span>
          </button>
        ))}
      </div>

      {loading && <p className="text-ivory/60">Counting…</p>}
      {error && (
        <p className="surface p-4 text-grade-daif">Lookup failed — is the API running?</p>
      )}

      {result && !loading && (
        <div className="space-y-6">
          <p className="text-lg">
            <span className="arabic text-2xl text-amber-node">{result.word}</span>{" "}
            appears{" "}
            <span className="font-mono">{result.total.toLocaleString()}</span>{" "}
            time(s).
          </p>

          {result.total === 0 ? (
            <p className="text-ivory/60">
              No occurrences recorded — try another word or check the spelling.
            </p>
          ) : (
            <>
              <div className="surface space-y-2 p-5">
                <h2 className="font-crimson text-amber-node">By book</h2>
                {result.per_book.map((b) => (
                  <div key={b.book} className="flex items-center gap-3 text-sm">
                    <span className="w-28 shrink-0 truncate text-ivory/70">{b.book}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-ivory/5">
                      <div
                        className="h-full bg-amber-node"
                        style={{ width: `${(b.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right font-mono text-ivory/60">
                      {b.count}
                    </span>
                  </div>
                ))}
              </div>

              {result.sample_hadiths.length > 0 && (
                <div className="surface space-y-2 p-5">
                  <h2 className="font-crimson text-amber-node">Sample hadiths</h2>
                  <ul className="space-y-1">
                    {result.sample_hadiths.map((h) => (
                      <li key={h.id}>
                        <Link
                          href={`/reader/${h.book__slug}/${h.id}`}
                          className="font-mono text-sm hover:text-amber-node"
                        >
                          {h.global_reference}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
