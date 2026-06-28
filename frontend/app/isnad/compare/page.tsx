"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RELIABILITY_COLORS } from "@/lib/grading";
import { getSanad, searchHadiths } from "@/lib/api/hadith";
import { compareIsnad, type CompareResult } from "@/lib/api/isnad";
import type { ChainNarrator, HadithListItem } from "@/lib/api/types";

/** Search-and-pick a hadith by its text instead of having to know a numeric ID. */
function HadithPicker({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: HadithListItem | null;
  onSelect: (h: HadithListItem | null) => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<HadithListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const page = await searchHadiths({ q: term, lang: "en" });
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
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-amber-node/50 bg-amber-node/10 px-3 py-2 text-left"
        >
          <span className="flex flex-col leading-tight">
            <span className="font-mono text-sm text-amber-node">{selected.global_reference}</span>
            <span className="arabic line-clamp-1 text-sm">{selected.matn_arabic}</span>
          </span>
          <span className="shrink-0 text-xs text-ivory/50">change</span>
        </button>
      ) : (
        <div ref={boxRef} className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            placeholder="Search a hadith by its English text…"
            className="w-full rounded-lg border border-white/10 bg-indigo-navy px-3 py-2 outline-none focus:border-amber-node"
          />
          {open && (loading || results.length > 0) && (
            <ul className="absolute z-20 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-white/10 bg-indigo-navy shadow-xl">
              {loading && <li className="px-3 py-2 text-sm text-ivory/40">Searching…</li>}
              {!loading &&
                results.map((h) => (
                  <li key={h.id}>
                    <button
                      onClick={() => {
                        onSelect(h);
                        setResults([]);
                        setQ("");
                        setOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left hover:bg-white/5"
                    >
                      <span className="font-mono text-xs text-ivory/60">{h.global_reference}</span>
                      <span className="mt-0.5 block line-clamp-1 text-sm text-ivory/80">
                        {h.translation_en || h.matn_arabic}
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

export default function CompareSanadPage() {
  const [h1, setH1] = useState<HadithListItem | null>(null);
  const [h2, setH2] = useState<HadithListItem | null>(null);
  const [chain1, setChain1] = useState<ChainNarrator[]>([]);
  const [chain2, setChain2] = useState<ChainNarrator[]>([]);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!h1 || !h2) return;
    setError(null);
    setLoading(true);
    try {
      const [s1, s2, cmp] = await Promise.all([
        getSanad(h1.id),
        getSanad(h2.id),
        compareIsnad(h1.id, h2.id),
      ]);
      setChain1(s1.chain);
      setChain2(s2.chain);
      setResult(cmp);
    } catch {
      setError("Could not load one of the chains for these hadiths.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const shared = new Set(result?.shared_narrators ?? []);

  return (
    <section className="space-y-6">
      <h1 className="font-crimson text-3xl font-bold">Compare Two Chains</h1>
      <p className="text-ivory/60">
        Overlay two isnads to spot where they share narrators and where they diverge.
      </p>

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <HadithPicker label="Hadith 1" selected={h1} onSelect={setH1} />
        <span className="self-center text-ivory/40 md:mt-8">vs</span>
        <HadithPicker label="Hadith 2" selected={h2} onSelect={setH2} />
      </div>

      <button
        onClick={run}
        disabled={!h1 || !h2 || loading}
        className="rounded-lg bg-indigo-scholar px-6 py-2 font-medium hover:bg-indigo-scholar/80 disabled:opacity-50"
      >
        {loading ? "Comparing…" : "Compare"}
      </button>

      {error && <p className="surface p-4 text-grade-daif">{error}</p>}

      {result && (
        <>
          <div className="flex flex-wrap gap-6 text-sm text-ivory/70">
            <span>
              <span className="text-amber-node">{shared.size}</span> shared narrator(s)
            </span>
            <span>
              Divergence point:{" "}
              <span className="text-amber-node">
                {result.divergence_point === null ? "—" : `position ${result.divergence_point + 1}`}
              </span>
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ChainColumn title={h1?.global_reference ?? "Hadith 1"} chain={chain1} shared={shared} />
            <ChainColumn title={h2?.global_reference ?? "Hadith 2"} chain={chain2} shared={shared} />
          </div>
        </>
      )}
    </section>
  );
}

function ChainColumn({
  title,
  chain,
  shared,
}: {
  title: string;
  chain: ChainNarrator[];
  shared: Set<number>;
}) {
  const ordered = [...chain].sort((a, b) => a.position - b.position);
  return (
    <div className="space-y-2">
      <h2 className="font-crimson text-lg text-amber-node">{title}</h2>
      {ordered.length === 0 && <p className="text-ivory/50">No chain data.</p>}
      {ordered.map((link) => {
        const isShared = shared.has(link.narrator.id);
        const color = RELIABILITY_COLORS[link.narrator.reliability_grade];
        return (
          <Link
            key={`${link.position}-${link.narrator.id}`}
            href={`/narrator/${link.narrator.id}`}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
              isShared
                ? "border-amber-node/70 bg-amber-node/10"
                : "border-white/10 bg-indigo-navy"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="arabic text-base">{link.narrator.name_arabic}</span>
            {isShared && <span className="ml-auto text-xs text-amber-node">shared</span>}
          </Link>
        );
      })}
    </div>
  );
}
