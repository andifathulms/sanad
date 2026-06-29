"use client";

import { useReaderSettings } from "@/lib/hooks/useReaderSettings";

/**
 * Compact translation block for list/reading cards that honours the reader's
 * EN / ID / Both preference (the same setting used on the detail page). Falls back
 * to the other language when the chosen one is missing, with a small label.
 */
export function CardTranslation({ en, id }: { en: string; id: string }) {
  const { translationLang } = useReaderSettings();

  const rows: { label: string | null; text: string }[] = [];
  if (translationLang === "both") {
    if (en) rows.push({ label: id ? "EN" : null, text: en });
    if (id) rows.push({ label: en ? "ID" : null, text: id });
  } else if (translationLang === "en") {
    if (en) rows.push({ label: null, text: en });
    else if (id) rows.push({ label: "ID (English not available)", text: id });
  } else {
    if (id) rows.push({ label: null, text: id });
    else if (en) rows.push({ label: "EN (Indonesian not available)", text: en });
  }

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2 border-t border-white/5 pt-3 text-ivory/80">
      {rows.map((r, i) => (
        <p key={i} className="leading-relaxed">
          {r.label && <span className="mr-2 text-xs uppercase text-ivory/35">{r.label}</span>}
          {r.text}
        </p>
      ))}
    </div>
  );
}
