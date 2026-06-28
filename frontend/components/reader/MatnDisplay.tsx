"use client";

import { useState } from "react";
import { stripTashkeel } from "@/lib/arabic";
import { useReaderSettings, type MatnTheme } from "@/lib/hooks/useReaderSettings";

const THEME_CLASS: Record<MatnTheme, string> = {
  night: "border-white/5 bg-indigo-navy text-ivory",
  sepia: "border-[#e0d4b8] bg-[#f4ecd8] text-[#3a2e1f]",
  paper: "border-black/10 bg-white text-[#1a1a1a]",
};

/**
 * Renders the Arabic matn honouring the reader's settings (font scale, tashkeel,
 * reading theme) with a copy button. The source text is never altered — tashkeel is
 * only stripped from the *rendered* copy, per CLAUDE.md (matn is shown exactly as
 * sourced; this is a view preference, not a mutation).
 */
export function MatnDisplay({
  arabic,
  baseRem = 1.875,
  bare = false,
}: {
  arabic: string;
  baseRem?: number;
  /** Render without the themed panel/copy chrome — for compact list cards. */
  bare?: boolean;
}) {
  const { arabicScale, showTashkeel, matnTheme } = useReaderSettings();
  const [copied, setCopied] = useState(false);

  // Some source entries are empty placeholders (section markers) — say so plainly
  // rather than rendering a blank panel.
  if (!arabic.trim()) {
    const note = (
      <p className="text-sm text-ivory/40">
        No Arabic text is recorded for this reference — the source entry is empty.
      </p>
    );
    return bare ? note : <div className="surface p-6">{note}</div>;
  }

  const text = showTashkeel ? arabic : stripTashkeel(arabic);

  async function copy() {
    try {
      await navigator.clipboard.writeText(arabic);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (bare) {
    return (
      <p className="arabic" style={{ fontSize: `${baseRem * arabicScale}rem` }} lang="ar">
        {text}
      </p>
    );
  }

  return (
    <div className={`relative rounded-xl border p-6 transition-colors ${THEME_CLASS[matnTheme]}`}>
      <button
        type="button"
        onClick={copy}
        className="absolute left-4 top-4 rounded-md border border-current px-2 py-1 text-xs opacity-50 hover:opacity-100"
        aria-label="Copy Arabic text"
      >
        {copied ? "✓ Copied" : "⧉ Copy"}
      </button>
      <p className="arabic" style={{ fontSize: `${baseRem * arabicScale}rem` }} lang="ar">
        {text}
      </p>
    </div>
  );
}
