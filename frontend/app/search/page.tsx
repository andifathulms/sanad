"use client";

import { useState } from "react";
import { searchHadiths } from "@/lib/api/hadith";
import { HadithCard } from "@/components/reader/HadithCard";
import type { HadithListItem } from "@/lib/api/types";

type Lang = "ar" | "en" | "id";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [results, setResults] = useState<HadithListItem[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(false);
    try {
      const page = await searchHadiths({ q: q.trim(), lang });
      setResults(page.results);
      setCount(page.count);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="font-crimson text-3xl font-bold">Search the Corpus</h1>

      <form onSubmit={onSubmit} className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={lang === "ar" ? "ابحث في المتن…" : "Search hadith text…"}
          dir={lang === "ar" ? "rtl" : "ltr"}
          className={`flex-1 rounded-lg border border-white/10 bg-indigo-navy px-4 py-2 outline-none focus:border-amber-node ${
            lang === "ar" ? "arabic text-lg" : ""
          }`}
        />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          className="rounded-lg border border-white/10 bg-indigo-navy px-3 py-2"
        >
          <option value="en">English</option>
          <option value="id">Indonesian</option>
          <option value="ar">Arabic</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-indigo-scholar px-6 py-2 font-medium hover:bg-indigo-scholar/80"
        >
          Search
        </button>
      </form>

      {loading && <p className="text-ivory/60">Searching…</p>}
      {error && <p className="surface p-4 text-grade-daif">Search failed — is the API running?</p>}
      {count !== null && !loading && (
        <p className="text-sm text-ivory/50">{count.toLocaleString()} result(s)</p>
      )}

      <div className="space-y-5">
        {results.map((h) => (
          <HadithCard key={h.id} hadith={h} />
        ))}
      </div>
    </section>
  );
}
