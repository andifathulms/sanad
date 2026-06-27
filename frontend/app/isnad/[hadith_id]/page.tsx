import { getHadith, getSanad } from "@/lib/api/hadith";
import { IsnadGraph } from "@/components/isnad/IsnadGraph";
import { ChainProvenance } from "@/components/isnad/ChainProvenance";
import type { HadithDetail, SanadResponse } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function IsnadPage({ params }: { params: { hadith_id: string } }) {
  let sanad: SanadResponse;
  let hadith: HadithDetail | null = null;
  try {
    sanad = await getSanad(params.hadith_id);
    hadith = await getHadith(params.hadith_id).catch(() => null);
  } catch {
    return <p className="surface p-4">Chain not found or API unavailable.</p>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-crimson text-2xl font-bold">Isnad Graph</h1>
        <span className="font-mono text-sm text-ivory/60">
          {hadith?.global_reference ?? `Hadith #${params.hadith_id}`}
        </span>
      </div>
      {sanad.graph_data.nodes.length ? (
        <>
          <IsnadGraph data={sanad.graph_data} />
          <ChainProvenance chainType={hadith?.chain_type} />
        </>
      ) : (
        <p className="surface p-4 text-ivory/60">No chain data available for this hadith yet.</p>
      )}
    </section>
  );
}
