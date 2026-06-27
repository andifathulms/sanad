"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GradeBar } from "@/components/analytics/GradeBar";
import { listBookmarks, me, type Bookmark } from "@/lib/api/auth";
import { getCorpusOverview } from "@/lib/api/analytics";
import type { CorpusOverview, Grade, GradeDistribution } from "@/lib/api/types";
import { useAuth } from "@/lib/hooks/useAuth";

const GRADES: Grade[] = ["sahih", "hasan", "daif", "maudu", "unknown"];

function toDistribution(by: Partial<Record<Grade, number>>): GradeDistribution {
  return GRADES.reduce((acc, g) => {
    acc[g] = by[g] ?? 0;
    return acc;
  }, {} as GradeDistribution);
}

function CorpusOverviewCard() {
  const [overview, setOverview] = useState<CorpusOverview | null>(null);
  useEffect(() => {
    getCorpusOverview()
      .then(setOverview)
      .catch(() => undefined);
  }, []);

  if (!overview) return null;
  return (
    <div className="surface space-y-3 p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-crimson text-xl text-amber-node">Corpus overview</h2>
        <span className="font-mono text-2xl">
          {overview.total_hadiths.toLocaleString()}
          <span className="ml-2 text-sm text-ivory/40">hadiths</span>
        </span>
      </div>
      <GradeBar dist={toDistribution(overview.by_grade)} />
      <Link href="/analyze/grades" className="text-sm text-amber-node hover:underline">
        Per-book grade distribution →
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { authed } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!authed) {
      setLoaded(true);
      return;
    }
    Promise.all([me(), listBookmarks()])
      .then(([u, bs]) => {
        setUsername(u.username);
        setBookmarks(bs);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [authed]);

  return (
    <section className="space-y-6">
      <h1 className="font-crimson text-3xl font-bold">
        {username ? `Welcome, ${username}` : "Dashboard"}
      </h1>

      <CorpusOverviewCard />

      <div>
        <h2 className="mb-3 font-crimson text-xl text-amber-node">Your bookmarks</h2>
        {loaded && !authed ? (
          <p className="text-ivory/60">
            <Link href="/login" className="text-amber-node hover:underline">
              Sign in
            </Link>{" "}
            to save and review bookmarks.
          </p>
        ) : bookmarks.length === 0 ? (
          <p className="text-ivory/60">No bookmarks yet — save a hadith from the reader.</p>
        ) : (
          <ul className="space-y-2">
            {bookmarks.map((b) => (
              <li key={b.id} className="surface flex items-center justify-between p-4">
                <Link href={`/reader/_/${b.hadith}`} className="font-mono text-sm hover:text-amber-node">
                  Hadith #{b.hadith}
                </Link>
                <span className="text-xs text-ivory/40">
                  {new Date(b.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
