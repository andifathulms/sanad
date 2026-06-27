"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listHistory, type ReadingHistoryEntry } from "@/lib/api/auth";
import { useAuth } from "@/lib/hooks/useAuth";

export function RecentReadingCard() {
  const { authed } = useAuth();
  const [entries, setEntries] = useState<ReadingHistoryEntry[]>([]);

  useEffect(() => {
    if (!authed) return;
    listHistory()
      .then((e) => setEntries(e.slice(0, 10)))
      .catch(() => undefined);
  }, [authed]);

  if (!authed) return null;

  return (
    <div>
      <h2 className="mb-3 font-crimson text-xl text-amber-node">Recently read</h2>
      {entries.length === 0 ? (
        <p className="text-ivory/60">Hadiths you open will appear here.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="surface flex items-center justify-between gap-3 p-4">
              <Link
                href={`/reader/${e.hadith_detail.book_slug}/${e.hadith}`}
                className="truncate font-mono text-sm hover:text-amber-node"
              >
                {e.hadith_detail.global_reference}
              </Link>
              <span className="shrink-0 text-xs text-ivory/40">
                {new Date(e.read_at).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
