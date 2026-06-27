"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PagerTarget {
  href: string;
  label: string;
}

/**
 * Previous/next navigation for continuous reading. Renders as buttons and also
 * binds the ← / → arrow keys (ignored while typing in an input) so a reader can
 * flow through a collection without returning to the chapter list.
 */
export function HadithPager({ prev, next }: { prev: PagerTarget | null; next: PagerTarget | null }) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (el?.isContentEditable) return;
      if (e.key === "ArrowLeft" && prev) router.push(prev.href);
      if (e.key === "ArrowRight" && next) router.push(next.href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, router]);

  return (
    <nav className="flex items-stretch justify-between gap-3" aria-label="Hadith navigation">
      {prev ? (
        <Link
          href={prev.href}
          rel="prev"
          className="group flex flex-1 flex-col rounded-lg border border-white/10 bg-indigo-navy px-4 py-3 hover:border-amber-node/50"
        >
          <span className="text-xs text-ivory/40">← Previous</span>
          <span className="font-mono text-sm text-ivory/70 group-hover:text-amber-node">
            {prev.label}
          </span>
        </Link>
      ) : (
        <span className="flex-1 rounded-lg border border-white/5 px-4 py-3 text-xs text-ivory/25">
          ← Start of collection
        </span>
      )}
      {next ? (
        <Link
          href={next.href}
          rel="next"
          className="group flex flex-1 flex-col items-end rounded-lg border border-white/10 bg-indigo-navy px-4 py-3 text-right hover:border-amber-node/50"
        >
          <span className="text-xs text-ivory/40">Next →</span>
          <span className="font-mono text-sm text-ivory/70 group-hover:text-amber-node">
            {next.label}
          </span>
        </Link>
      ) : (
        <span className="flex-1 rounded-lg border border-white/5 px-4 py-3 text-right text-xs text-ivory/25">
          End of collection →
        </span>
      )}
    </nav>
  );
}
