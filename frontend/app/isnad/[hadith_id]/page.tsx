import Link from "next/link";
import { getSanad } from "@/lib/api/hadith";
import { IsnadGraph } from "@/components/isnad/IsnadGraph";
import type { SanadResponse } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function IsnadPage({ params }: { params: { hadith_id: string } }) {
  let sanad: SanadResponse;
  try {
    sanad = await getSanad(params.hadith_id);
  } catch {
    return <p className="surface p-4">Chain not found or API unavailable.</p>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-crimson text-2xl font-bold">Isnad Graph</h1>
        <Link href="#" className="text-sm text-ivory/60">
          Hadith #{params.hadith_id}
        </Link>
      </div>
      {sanad.graph_data.nodes.length ? (
        <IsnadGraph data={sanad.graph_data} />
      ) : (
        <p className="surface p-4 text-ivory/60">No chain data available for this hadith yet.</p>
      )}
    </section>
  );
}
