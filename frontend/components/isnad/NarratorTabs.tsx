"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NarratorListCard } from "@/components/isnad/NarratorListCard";
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = async () => {
      try {
        if (tab === "hadiths") {
          const page = await getNarratorHadiths(narratorId);
          if (!cancelled) setHadiths(page.results);
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
        <div className="grid gap-3 md:grid-cols-2">
          {people.length ? (
            people.map((n) => <NarratorListCard key={n.id} narrator={n} />)
          ) : (
            <p className="text-ivory/50">No {tab} recorded in the corpus yet.</p>
          )}
        </div>
      )}

      {!loading && tab === "hadiths" && (
        <ul className="space-y-2">
          {hadiths.length ? (
            hadiths.map((h) => (
              <li key={h.id} className="surface p-4">
                <Link
                  href={`/reader/${h.book_slug}/${h.id}`}
                  className="font-mono text-sm text-ivory/70 hover:text-amber-node"
                >
                  {h.global_reference}
                </Link>
                <p className="arabic mt-1 line-clamp-2 text-lg">{h.matn_arabic}</p>
              </li>
            ))
          ) : (
            <p className="text-ivory/50">No hadiths recorded yet.</p>
          )}
        </ul>
      )}
    </div>
  );
}
