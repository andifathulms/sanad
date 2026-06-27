import Link from "next/link";
import { HadithCard } from "@/components/reader/HadithCard";
import { getTopicHadiths } from "@/lib/api/topics";
import type { HadithListItem } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const page = searchParams.page ? Number(searchParams.page) : 1;
  let hadiths: HadithListItem[] = [];
  let count = 0;
  let hasNext = false;
  try {
    const res = await getTopicHadiths(params.slug, page);
    hadiths = res.results;
    count = res.count;
    hasNext = Boolean(res.next);
  } catch {
    return <p className="surface p-6">Topic not found or API unavailable.</p>;
  }

  const title = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);

  return (
    <section className="space-y-5">
      <Link href="/explore" className="text-sm text-ivory/60 hover:text-amber-node">
        ← All topics
      </Link>
      <h1 className="font-crimson text-3xl font-bold capitalize">{title}</h1>
      <p className="text-sm text-ivory/50">{count.toLocaleString()} hadith(s)</p>

      {hadiths.map((h) => (
        <HadithCard key={h.id} hadith={h} />
      ))}
      {hadiths.length === 0 && (
        <p className="surface p-4 text-ivory/60">No hadiths tagged under this topic yet.</p>
      )}

      <div className="flex justify-between pt-2 text-sm">
        {page > 1 ? (
          <Link href={`/explore/${params.slug}?page=${page - 1}`} className="text-amber-node hover:underline">
            ← Previous
          </Link>
        ) : (
          <span />
        )}
        {hasNext && (
          <Link href={`/explore/${params.slug}?page=${page + 1}`} className="text-amber-node hover:underline">
            Next →
          </Link>
        )}
      </div>
    </section>
  );
}
