import type { HadithDetail } from "@/lib/api/types";

type QuranRef = HadithDetail["quran_refs"][number];

const RELEVANCE_LABELS: Record<string, string> = {
  explains: "Explains",
  context: "Context",
  mentions: "Mentions",
};

// Bridge target: a Quranlytics deployment when configured, else quran.com.
const QURAN_BASE = process.env.NEXT_PUBLIC_QURANLYTICS_BASE ?? "https://quran.com";
const verseHref = (r: QuranRef) => `${QURAN_BASE}/${r.surah_number}/${r.verse_number}`;

/**
 * "Related Qur'an verses" — the Quran ↔ Hadith bridge. Links are curated
 * connections, not interpretation; the reader follows through to the verse.
 */
export function QuranRefs({ refs }: { refs: QuranRef[] }) {
  if (!refs || refs.length === 0) return null;
  return (
    <div className="surface space-y-3 p-5">
      <h3 className="font-crimson text-amber-node">Related Qur&apos;an verses</h3>
      <ul className="space-y-2">
        {refs.map((r) => (
          <li key={`${r.surah_number}:${r.verse_number}`} className="flex items-center gap-3">
            <a
              href={verseHref(r)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm hover:text-amber-node"
            >
              Surah {r.surah_number} : Ayah {r.verse_number}
            </a>
            <span className="rounded-full bg-indigo-navy px-2 py-0.5 text-xs text-ivory/50">
              {RELEVANCE_LABELS[r.relevance_type] ?? r.relevance_type}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
