"use client";

import Link from "next/link";
import { useState } from "react";
import { RELIABILITY_COLORS } from "@/components/reader/NarratorChip";
import { getSanad } from "@/lib/api/hadith";
import { compareIsnad, type CompareResult } from "@/lib/api/isnad";
import type { ChainNarrator } from "@/lib/api/types";

export default function CompareSanadPage() {
  const [h1, setH1] = useState("");
  const [h2, setH2] = useState("");
  const [chain1, setChain1] = useState<ChainNarrator[]>([]);
  const [chain2, setChain2] = useState<ChainNarrator[]>([]);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const [s1, s2, cmp] = await Promise.all([
        getSanad(h1),
        getSanad(h2),
        compareIsnad(Number(h1), Number(h2)),
      ]);
      setChain1(s1.chain);
      setChain2(s2.chain);
      setResult(cmp);
    } catch {
      setError("Could not load one of the chains — check the hadith IDs.");
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

      <form onSubmit={run} className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-ivory/50">Hadith 1 (ID)</span>
          <input
            value={h1}
            onChange={(e) => setH1(e.target.value)}
            className="mt-1 w-32 rounded-lg border border-white/10 bg-indigo-navy px-3 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="block text-ivory/50">Hadith 2 (ID)</span>
          <input
            value={h2}
            onChange={(e) => setH2(e.target.value)}
            className="mt-1 w-32 rounded-lg border border-white/10 bg-indigo-navy px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={!h1 || !h2 || loading}
          className="rounded-lg bg-indigo-scholar px-6 py-2 font-medium hover:bg-indigo-scholar/80 disabled:opacity-50"
        >
          Compare
        </button>
      </form>

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
            <ChainColumn title={`Hadith #${h1}`} chain={chain1} shared={shared} />
            <ChainColumn title={`Hadith #${h2}`} chain={chain2} shared={shared} />
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
