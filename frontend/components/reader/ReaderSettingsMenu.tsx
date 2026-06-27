"use client";

import { useEffect, useRef, useState } from "react";
import {
  ARABIC_SCALES,
  useReaderSettings,
  type MatnTheme,
  type TranslationLang,
} from "@/lib/hooks/useReaderSettings";

const THEMES: { key: MatnTheme; label: string }[] = [
  { key: "night", label: "Night" },
  { key: "sepia", label: "Sepia" },
  { key: "paper", label: "Paper" },
];

const LANGS: { key: TranslationLang; label: string }[] = [
  { key: "en", label: "EN" },
  { key: "id", label: "ID" },
  { key: "both", label: "Both" },
];

/** Header gear opening the global reading preferences (persisted to localStorage). */
export function ReaderSettingsMenu() {
  const s = useReaderSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const scaleIdx = ARABIC_SCALES.indexOf(s.arabicScale);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Reading settings"
        className="rounded-lg px-2 py-1.5 text-base hover:text-amber-node focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-node"
      >
        ⚙
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-1 w-72 space-y-4 rounded-xl border border-white/10 bg-indigo-navy p-4 text-sm text-ivory shadow-xl">
          <p className="font-crimson text-amber-node">Reading settings</p>

          {/* Arabic size */}
          <div className="flex items-center justify-between">
            <span className="text-ivory/70">Arabic size</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => s.setArabicScale(ARABIC_SCALES[Math.max(0, scaleIdx - 1)])}
                disabled={scaleIdx <= 0}
                className="h-7 w-7 rounded-md border border-white/10 disabled:opacity-30"
                aria-label="Decrease Arabic size"
              >
                A−
              </button>
              <button
                type="button"
                onClick={() =>
                  s.setArabicScale(ARABIC_SCALES[Math.min(ARABIC_SCALES.length - 1, scaleIdx + 1)])
                }
                disabled={scaleIdx >= ARABIC_SCALES.length - 1}
                className="h-7 w-7 rounded-md border border-white/10 text-base disabled:opacity-30"
                aria-label="Increase Arabic size"
              >
                A+
              </button>
            </div>
          </div>

          {/* Reading theme */}
          <div className="flex items-center justify-between">
            <span className="text-ivory/70">Reading surface</span>
            <div className="flex gap-1">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => s.setMatnTheme(t.key)}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    s.matnTheme === t.key
                      ? "border-amber-node text-amber-node"
                      : "border-white/10 text-ivory/70"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Translation language */}
          <div className="flex items-center justify-between">
            <span className="text-ivory/70">Translation</span>
            <div className="flex gap-1">
              {LANGS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => s.setTranslationLang(l.key)}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    s.translationLang === l.key
                      ? "border-amber-node text-amber-node"
                      : "border-white/10 text-ivory/70"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tashkeel */}
          <label className="flex items-center justify-between">
            <span className="text-ivory/70">Show tashkeel (harakat)</span>
            <input
              type="checkbox"
              checked={s.showTashkeel}
              onChange={s.toggleTashkeel}
              className="h-4 w-4 accent-amber-node"
            />
          </label>

          {/* Honorifics */}
          <label className="flex items-center justify-between">
            <span className="text-ivory/70">Narrator honorifics (RA / rh)</span>
            <input
              type="checkbox"
              checked={s.showHonorifics}
              onChange={s.toggleHonorifics}
              className="h-4 w-4 accent-amber-node"
            />
          </label>
        </div>
      )}
    </div>
  );
}
