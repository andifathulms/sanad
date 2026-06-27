"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RELIABILITY_COLORS } from "@/lib/grading";
import { searchNarrators } from "@/lib/api/isnad";
import { getNarratorPath, type PathNarrator } from "@/lib/api/network";
import type { Narrator } from "@/lib/api/types";

/**
 * Inline narrator picker with live typeahead: results appear in a dropdown as you
 * type (in Latin OR Arabic — the backend matches transliteration too), so you don't
 * need to know a narrator's exact Arabic spelling to find them.
 */
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
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search-as-you-type (min 2 chars).
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const page = await searchNarrators({ q: term });
        setResults(page.results.slice(0, 8));
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="flex-1 space-y-2">
      <p className="text-sm text-ivory/50">{label}</p>
      {selected ? (
        <button
          onClick={() => onSelect(null)}
          className="flex w-full items-center justify-between rounded-lg border border-amber-node/50 bg-amber-node/10 px-3 py-2"
        >
          <span className="flex flex-col items-start leading-tight">
            <span className="arabic text-lg">{selected.name_arabic}</span>
            {selected.name_transliteration && (
              <span className="text-xs text-ivory/50">{selected.name_transliteration}</span>
            )}
          </span>
          <span className="text-xs text-ivory/50">change</span>
        </button>
      ) : (
        <div ref={boxRef} className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            dir="auto"
            placeholder="Type a name, e.g. Abu Hurayra or أبو هريرة"
            className="w-full rounded-lg border border-white/10 bg-indigo-navy px-3 py-2 outline-none focus:border-amber-node"
          />
          {open && (loading || results.length > 0) && (
            <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-white/10 bg-indigo-navy shadow-xl">
              {loading && <li className="px-3 py-2 text-sm text-ivory/40">Searching…</li>}
              {!loading &&
                results.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        onSelect(n);
                        setResults([]);
                        setQ("");
                        setOpen(false);
                      }}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/5"
                    >
                      <span className="flex flex-col leading-tight">
                        <span className="arabic text-base">{n.name_arabic}</span>
                        {n.name_transliteration && (
                          <span className="text-xs text-ivory/50">{n.name_transliteration}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-ivory/40">
                        {n.total_hadiths.toLocaleString()} hadiths
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </div>
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
