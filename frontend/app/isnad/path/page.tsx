"use client";

import Link from "next/link";
import { useState } from "react";
import { RELIABILITY_COLORS } from "@/components/reader/NarratorChip";
import { searchNarrators } from "@/lib/api/isnad";
import { getNarratorPath, type PathNarrator } from "@/lib/api/network";
import type { Narrator } from "@/lib/api/types";

/** Inline narrator picker: search by name, click a result to select it. */
function Picker({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: Narrator | null;
  onSelect: (n: Narrator | null) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Narrator[]>([]);

  async function search() {
    if (!q.trim()) return;
    try {
      const page = await searchNarrators({ q: q.trim() });
      setResults(page.results.slice(0, 6));
    } catch {
      setResults([]);
    }
  }

  return (
    <div className="flex-1 space-y-2">
      <p className="text-sm text-ivory/50">{label}</p>
      {selected ? (
        <button
          onClick={() => onSelect(null)}
          className="flex w-full items-center justify-between rounded-lg border border-amber-node/50 bg-amber-node/10 px-3 py-2"
        >
          <span className="arabic text-lg">{selected.name_arabic}</span>
          <span className="text-xs text-ivory/50">change</span>
        </button>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search narrator…"
              dir="rtl"
              className="arabic flex-1 rounded-lg border border-white/10 bg-indigo-navy px-3 py-2 text-lg outline-none focus:border-amber-node"
            />
            <button onClick={search} className="rounded-lg bg-indigo-scholar px-4 hover:bg-indigo-scholar/80">
              ↵
            </button>
          </div>
          {results.length > 0 && (
            <ul className="space-y-1">
              {results.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => {
                      onSelect(n);
                      setResults([]);
                      setQ("");
                    }}
                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-indigo-navy px-3 py-1.5 hover:border-amber-node/40"
                  >
                    <span className="arabic">{n.name_arabic}</span>
                    <span className="text-xs text-ivory/40">{n.total_hadiths} hadiths</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function NarratorPathPage() {
  const [from, setFrom] = useState<Narrator | null>(null);
  const [to, setTo] = useState<Narrator | null>(null);
  const [path, setPath] = useState<PathNarrator[] | null>(null);
  const [length, setLength] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function findPath() {
    if (!from || !to) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await getNarratorPath(from.id, to.id);
      setPath(res.path);
      setLength(res.length);
    } catch {
      setPath([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-crimson text-3xl font-bold">Narrator Path Finder</h1>
        <p className="text-sm text-ivory/60">
          Trace the shortest chain of transmission connecting any two narrators.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <Picker label="From" selected={from} onSelect={setFrom} />
        <span className="self-center text-ivory/40 md:mt-8">→</span>
        <Picker label="To" selected={to} onSelect={setTo} />
      </div>

      <button
        onClick={findPath}
        disabled={!from || !to || loading}
        className="rounded-lg bg-indigo-scholar px-6 py-2 font-medium hover:bg-indigo-scholar/80 disabled:opacity-50"
      >
        {loading ? "Searching…" : "Find path"}
      </button>

      {searched && !loading && (
        <div className="space-y-3">
          {path && path.length > 0 ? (
            <>
              <p className="text-sm text-ivory/50">{length} hop(s)</p>
              <div className="flex flex-wrap items-center gap-2">
                {path.map((n, i) => (
                  <div key={n.id} className="flex items-center gap-2">
                    <Link
                      href={`/narrator/${n.id}`}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-indigo-navy px-3 py-2 hover:border-amber-node/50"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: RELIABILITY_COLORS[n.reliability_grade as keyof typeof RELIABILITY_COLORS] ?? "#95A5A6" }}
                      />
                      <span className="arabic text-base">{n.name_arabic}</span>
                    </Link>
                    {i < path.length - 1 && <span className="text-ivory/30">→</span>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="surface p-4 text-ivory/60">
              No connecting chain found between these two narrators in the corpus.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
