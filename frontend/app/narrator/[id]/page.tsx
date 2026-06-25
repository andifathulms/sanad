import { getNarrator } from "@/lib/api/hadith";
import { RELIABILITY_COLORS } from "@/components/reader/NarratorChip";
import type { Narrator } from "@/lib/api/types";

export const dynamic = "force-dynamic";

const GENERATION_LABELS: Record<string, string> = {
  sahabi: "Sahabi (Companion)",
  tabii: "Tabi'i (Successor)",
  taba_tabii: "Tabi' al-Tabi'in",
  later: "Later Generation",
  collector: "Hadith Collector",
  unknown: "Unknown",
};

export default async function NarratorPage({ params }: { params: { id: string } }) {
  let narrator: Narrator;
  try {
    narrator = await getNarrator(params.id);
  } catch {
    return <p className="surface p-4">Narrator not found or API unavailable.</p>;
  }
  const color = RELIABILITY_COLORS[narrator.reliability_grade];

  return (
    <section className="space-y-6">
      <header className="surface p-6">
        <p className="arabic text-4xl text-amber-node">{narrator.name_arabic}</p>
        <h1 className="mt-2 font-crimson text-2xl">{narrator.name_transliteration}</h1>
        {narrator.kunya && <p className="text-ivory/60">{narrator.kunya}</p>}
        <div className="mt-4 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="capitalize" style={{ color }}>
            {narrator.reliability_grade}
          </span>
        </div>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Generation" value={GENERATION_LABELS[narrator.generation] ?? narrator.generation} />
        <Fact label="Death (AH)" value={narrator.death_year_ah?.toString() ?? "—"} />
        <Fact label="Hadiths" value={narrator.total_hadiths.toLocaleString()} />
        <Fact label="Centrality" value={narrator.centrality_score.toFixed(4)} />
      </dl>

      <p className="text-sm text-ivory/50">
        Teacher/student tabs and the ego-network graph land in Phase 2. Reliability
        assessments are always attributed to classical rijal scholarship.
      </p>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <dt className="text-xs uppercase tracking-wide text-ivory/40">{label}</dt>
      <dd className="mt-1 font-mono text-lg">{value}</dd>
    </div>
  );
}
