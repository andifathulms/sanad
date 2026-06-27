"use client";

import { useState, type ReactNode } from "react";

export interface StudyTab {
  key: string;
  label: string;
  content: ReactNode;
}

/**
 * "Study this hadith" — keeps the analytical panels (chain, gradings, parallels,
 * Qur'an links, share) one tap away instead of stacked below the text, so the
 * reading surface stays focused on the matn and its translation.
 */
export function StudyTabs({ tabs }: { tabs: StudyTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  if (tabs.length === 0) return null;
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <section className="space-y-4">
      <h2 className="font-crimson text-xl text-ivory/80">Study this hadith</h2>
      <div className="flex flex-wrap gap-2 border-b border-white/10">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            aria-current={t.key === current.key}
            className={`px-4 py-2 text-sm transition ${
              t.key === current.key
                ? "border-b-2 border-amber-node text-amber-node"
                : "text-ivory/60 hover:text-ivory"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{current.content}</div>
    </section>
  );
}
