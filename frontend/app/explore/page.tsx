import Link from "next/link";
import { getTopics } from "@/lib/api/topics";
import type { Topic } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  let topics: Topic[] = [];
  try {
    topics = await getTopics();
  } catch {
    return <p className="surface p-6">Topics are unavailable right now.</p>;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-crimson text-3xl font-bold">Explore by topic</h1>
        <p className="text-sm text-ivory/60">
          Curated subject tags across the corpus. Topics group narrations for
          browsing — they are not a ruling or interpretation.
        </p>
      </header>

      {topics.length === 0 ? (
        <p className="text-ivory/60">No topics curated yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => (
            <Link
              key={t.slug}
              href={`/explore/${t.slug}`}
              className="surface flex items-center justify-between p-5 hover:border-amber-node/40"
            >
              <div>
                <p className="arabic text-xl text-amber-node">{t.name_arabic}</p>
                <p className="font-crimson text-lg">{t.name_en}</p>
              </div>
              <span className="font-mono text-sm text-ivory/40">{t.hadith_count}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
