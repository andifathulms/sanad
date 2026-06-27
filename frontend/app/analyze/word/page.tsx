"use client";

import Link from "next/link";
import { useState } from "react";
import { getWordFrequency } from "@/lib/api/analytics";
import type { WordFrequency } from "@/lib/api/types";

export default function WordFrequencyPage() {
  const [word, setWord] = useState("");
  const [result, setResult] = useState<WordFrequency | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = word.trim();
    if (!w) return;
    setLoading(true);
    setError(false);
    try {
      setResult(await getWordFrequency(w));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const maxCount = result
    ? Math.max(1, ...result.per_book.map((b) => b.count))
    : 1;

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-crimson text-3xl font-bold">Word frequency</h1>
        <p className="text-sm text-ivory/60">
          How often an Arabic word appears across the corpus, by book. Counts
          come from the precomputed frequency index (tashkeel-insensitive).
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
