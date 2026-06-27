import Link from "next/link";
import { getMutabiShahid } from "@/lib/api/analytics";
import type { ParallelHadith } from "@/lib/api/types";

function ParallelRow({ p }: { p: ParallelHadith }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-ivory/5 py-2 last:border-0">
      <Link
        href={`/reader/${p.book}/${p.hadith_id}`}
        className="font-mono text-sm hover:text-amber-node"
      >
        {p.global_reference}
      </Link>
      <span className="font-mono text-xs text-ivory/40">
        {Math.round(p.similarity_score * 100)}% match
      </span>
    </li>
  );
}

function Group({
  title,
  blurb,
  rows,
}: {
  title: string;
  blurb: string;
  rows: ParallelHadith[];
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="font-crimson text-ivory/90">{title}</h4>
      <p className="mb-2 text-xs text-ivory/40">{blurb}</p>
      <ul>
        {rows.map((p) => (
          <ParallelRow key={p.hadith_id} p={p} />
        ))}
      </ul>
    </div>
  );
}

/**
 * Server component: surfaces the precomputed parallel-narration data
 * (mutabi' / shahid) that already lives in the backend but had no UI.
 * Renders nothing when the hadith has no recorded parallels.
 */
export async function ParallelNarrations({ hadithId }: { hadithId: number }) {
  let mutabi: ParallelHadith[] = [];
  let shahid: ParallelHadith[] = [];
  try {
    const data = await getMutabiShahid(hadithId);
    mutabi = data.mutabi ?? [];
    shahid = data.shahid ?? [];
  } catch {
    return null; // analytics optional — never block the reader
  }

  if (mutabi.length === 0 && shahid.length === 0) return null;

  return (
    <div className="surface space-y-4 p-6">
      <div>
        <h3 className="font-crimson text-amber-node">Parallel narrations</h3>
        <p className="text-xs text-ivory/40">
          Textually similar narrations found across the corpus. Match scores are
          computed from the matn (text), not the chain.
        </p>
      </div>
      <Group
        title="Mutābiʿ"
        blurb="Same Companion — a corroborating chain through the same first narrator."
        rows={mutabi}
      />
      <Group
        title="Shāhid"
        blurb="Different Companion — an independent witnessing narration."
        rows={shahid}
      />
    </div>
  );
}
