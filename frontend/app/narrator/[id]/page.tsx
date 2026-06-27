import { getNarrator } from "@/lib/api/hadith";
import { NarratorTabs } from "@/components/isnad/NarratorTabs";
import { HonorificTag } from "@/components/reader/HonorificTag";
import { RELIABILITY_COLORS, RELIABILITY_LABELS, isAssessed } from "@/lib/grading";
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
  const assessed = isAssessed(narrator.reliability_grade);

  return (
    <section className="space-y-6">
      <header className="surface p-6">
        <p className="arabic text-4xl text-amber-node">{narrator.name_arabic}</p>
        <h1 className="mt-2 font-crimson text-2xl">
          {narrator.name_transliteration}{" "}
          <HonorificTag generation={narrator.generation} className="text-lg" />
        </h1>
        {narrator.kunya && <p className="text-ivory/60">{narrator.kunya}</p>}
        <div className="mt-4 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          <span style={{ color }}>{RELIABILITY_LABELS[narrator.reliability_grade]}</span>
        </div>
        {assessed ? (
          <p className="mt-1 text-xs text-ivory/50">
            According to:{" "}
            {narrator.bio_source?.trim() || "classical rijal scholarship (source not recorded)"}
          </p>
        ) : (
          <p className="mt-1 text-xs text-ivory/40">
            No reliability assessment is recorded for this narrator in our data. Absence of a
            grade is not itself a verdict — consult the primary rijal literature.
          </p>
        )}
        {narrator.reliability_notes?.trim() && (
          <p className="mt-3 text-sm text-ivory/70">{narrator.reliability_notes}</p>
        )}
      </header>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Generation" value={GENERATION_LABELS[narrator.generation] ?? narrator.generation} />
        <Fact label="Death (AH)" value={narrator.death_year_ah?.toString() ?? "—"} />
        <Fact label="Hadiths" value={narrator.total_hadiths.toLocaleString()} />
        <Fact label="Centrality" value={narrator.centrality_score.toFixed(4)} />
      </dl>

      <NarratorTabs narratorId={narrator.id} />

      <p className="text-xs text-ivory/40">
        Chain links are extracted from the isnad text. Reliability assessments are always
        attributed to classical rijal scholarship — the platform never grades narrators itself.
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
