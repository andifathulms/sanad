"use client";

import { useEffect, useState } from "react";
import { GlobalNetwork } from "@/components/isnad/GlobalNetwork";
import { getGlobalNetwork, type NetworkResponse } from "@/lib/api/network";

const GENERATIONS = ["", "sahabi", "tabii", "taba_tabii", "later"];
const RELIABILITIES = ["", "thiqah", "saduq", "daif", "majhul", "unknown"];
const LEGEND: [string, string][] = [
  ["#27AE60", "Thiqah"],
  ["#F39C12", "Saduq"],
  ["#E74C3C", "Da'if"],
  ["#7F8C8D", "Majhul"],
  ["#95A5A6", "Unknown"],
];

export default function GlobalNetworkPage() {
  const [data, setData] = useState<NetworkResponse | null>(null);
  const [generation, setGeneration] = useState("");
  const [reliability, setReliability] = useState("");
  const [limit, setLimit] = useState(200);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setData(
        await getGlobalNetwork({
          limit,
          generation: generation || undefined,
          reliability: reliability || undefined,
        }),
      );
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generation, reliability, limit]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-crimson text-3xl font-bold">Narrator Network</h1>
          <p className="text-sm text-ivory/60">
            The most-central narrators and how they connect. Node size = appearances,
            color = reliability. Click any node to open its profile.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
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
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-indigo-navy px-3 py-2"
          >
            {[100, 200, 300, 500].map((n) => (
              <option key={n} value={n}>
                Top {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-ivory/60">
        {LEGEND.map(([color, label]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
        {data && (
          <span className="ml-auto text-ivory/40">
            {data.nodes.length} nodes · {data.edges.length} edges · {data.total_narrators.toLocaleString()} narrators total
          </span>
        )}
      </div>

      {loading && <p className="text-ivory/60">Computing layout…</p>}
      {data && data.nodes.length > 0 ? (
        <GlobalNetwork nodes={data.nodes} edges={data.edges} height={620} />
      ) : (
        !loading && <p className="surface p-4 text-ivory/60">No narrators match these filters.</p>
      )}
    </section>
  );
}
