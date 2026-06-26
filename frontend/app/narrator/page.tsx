"use client";

import { useEffect, useState } from "react";
import { NarratorListCard } from "@/components/isnad/NarratorListCard";
import { searchNarrators } from "@/lib/api/isnad";
import type { Narrator } from "@/lib/api/types";

const GENERATIONS = ["", "sahabi", "tabii", "taba_tabii", "later", "collector", "unknown"];
const RELIABILITIES = ["", "thiqah", "saduq", "daif", "majhul", "matruk", "unknown"];

export default function NarratorBrowsePage() {
  const [q, setQ] = useState("");
  const [generation, setGeneration] = useState("");
  const [reliability, setReliability] = useState("");
  const [results, setResults] = useState<Narrator[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const page = await searchNarrators({
        q: q.trim() || undefined,
        generation: generation || undefined,
        reliability_grade: reliability || undefined,
      });
      setResults(page.results);
      setCount(page.count);
    } catch {
      setResults([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }

  // Load an initial page on mount.
  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="space-y-6">
      <h1 className="font-crimson text-3xl font-bold">Rijal — Narrator Encyclopedia</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
        className="flex flex-wrap gap-3"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search narrator name…"
          dir="rtl"
          className="arabic flex-1 rounded-lg border border-white/10 bg-indigo-navy px-4 py-2 text-lg outline-none focus:border-amber-node"
        />
        <select
          value={generation}
          onChange={(e) => setGeneration(e.target.value)}
          className="rounded-lg border border-white/10 bg-indigo-navy px-3 py-2"
        >
          {GENERATIONS.map((g) => (
            <option key={g} value={g}>
              {g === "" ? "Any generation" : g}
            </option>
          ))}
        </select>
        <select
          value={reliability}
          onChange={(e) => setReliability(e.target.value)}
          className="rounded-lg border border-white/10 bg-indigo-navy px-3 py-2"
        >
          {RELIABILITIES.map((r) => (
            <option key={r} value={r}>
              {r === "" ? "Any reliability" : r}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-indigo-scholar px-6 py-2 font-medium hover:bg-indigo-scholar/80">
          Search
        </button>
      </form>

      {loading && <p className="text-ivory/60">Loading…</p>}
      {count !== null && !loading && (
        <p className="text-sm text-ivory/50">{count.toLocaleString()} narrator(s)</p>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {results.map((n) => (
          <NarratorListCard key={n.id} narrator={n} />
        ))}
      </div>
    </section>
  );
}
