"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listHistory, type ReadingHistoryEntry } from "@/lib/api/auth";
import { useAuth } from "@/lib/hooks/useAuth";

/**
 * "Continue reading" — surfaces the most recently opened hadith on the reader home
 * so a returning reader resumes in one tap instead of re-finding their place.
 * Renders nothing for signed-out users or those with no history.
 */
export function ContinueReading() {
  const { authed } = useAuth();
  const [entry, setEntry] = useState<ReadingHistoryEntry | null>(null);

  useEffect(() => {
    if (!authed) return;
    listHistory()
      .then((e) => setEntry(e[0] ?? null))
      .catch(() => undefined);
  }, [authed]);

  if (!authed || !entry) return null;

  return (
    <Link
      href={`/reader/${entry.hadith_detail.book_slug}/${entry.hadith}`}
      className="surface flex items-center justify-between gap-4 border-amber-node/30 p-5 hover:border-amber-node/60"
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-amber-node/80">Continue reading</p>
        <p className="mt-1 font-mono text-sm text-ivory/80">
          {entry.hadith_detail.global_reference}
        </p>
      </div>
      <span className="shrink-0 text-amber-node">→</span>
    </Link>
  );
}
