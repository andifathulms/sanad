"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NarratorListCard } from "@/components/isnad/NarratorListCard";
import { GradeBadge } from "@/components/reader/GradeBadge";
import { getNarratorHadiths, getNarratorStudents, getNarratorTeachers } from "@/lib/api/isnad";
import type { HadithListItem, Narrator } from "@/lib/api/types";

type Tab = "teachers" | "students" | "hadiths";
const TABS: { key: Tab; label: string }[] = [
  { key: "teachers", label: "Their Teachers" },
  { key: "students", label: "Their Students" },
  { key: "hadiths", label: "Their Hadiths" },
];

export function NarratorTabs({ narratorId }: { narratorId: number }) {
  const [tab, setTab] = useState<Tab>("teachers");
  const [people, setPeople] = useState<Narrator[]>([]);
  const [hadiths, setHadiths] = useState<HadithListItem[]>([]);
  const [hadithPage, setHadithPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadMoreHadiths() {
    setLoadingMore(true);
    try {
      const next = hadithPage + 1;
      const page = await getNarratorHadiths(narratorId, next);
      setHadiths((prev) => [...prev, ...page.results]);
      setHadithPage(next);
      setHasMore(Boolean(page.next));
    } catch {
      /* keep what we have */
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        if (tab === "hadiths") {
          const page = await getNarratorHadiths(narratorId, 1);
          if (!cancelled) {
            setHadiths(page.results);
            setHadithPage(1);
            setHasMore(Boolean(page.next));
          }
        } else {
          const list =
            tab === "teachers"
              ? await getNarratorTeachers(narratorId)
              : await getNarratorStudents(narratorId);
          if (!cancelled) setPeople(list);
        }
      } catch {
        if (!cancelled) {
          setPeople([]);
          setHadiths([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [tab, narratorId]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm ${
              tab === t.key
                ? "border-b-2 border-amber-node text-amber-node"
                : "text-ivory/60 hover:text-ivory"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-ivory/60">Loading…</p>}

      {!loading && tab !== "hadiths" && (
        <div className="space-y-3">
          <p className="text-xs text-ivory/40">
            Derived automatically from chain adjacency in the corpus (who narrates from
            whom). This is structural extraction, not curated rijal data — rare
            misreadings are possible.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {people.length ? (
              people.map((n) => <NarratorListCard key={n.id} narrator={n} />)
            ) : (
              <p className="text-ivory/50">No {tab} recorded in the corpus yet.</p>
            )}
          </div>
        </div>
      )}

      {!loading && tab === "hadiths" && (
        <div className="space-y-2">
          {hadiths.length ? (
            <>
              <ul className="space-y-2">
                {hadiths.map((h) => {
                  const translation = h.translation_en || h.translation_id;
                  return (
                    <li key={h.id} className="surface p-4">
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/reader/${h.book_slug}/${h.id}`}
                          className="font-mono text-sm text-ivory/70 hover:text-amber-node"
                        >
                          {h.global_reference}
                        </Link>
                        <GradeBadge grade={h.grade} source={h.grade_source} />
                      </div>
                      <p className="arabic mt-1 line-clamp-2 text-lg">{h.matn_arabic}</p>
                      {translation && (
                        <p className="mt-1 line-clamp-2 text-sm text-ivory/70">{translation}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
              {hasMore && (
                <button
                  onClick={loadMoreHadiths}
                  disabled={loadingMore}
                  className="w-full rounded-lg border border-white/10 bg-indigo-navy py-2 text-sm text-ivory/70 hover:border-amber-node/40 disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              )}
            </>
          ) : (
            <p className="text-ivory/50">No hadiths recorded yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
