"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sanad.reader.focus";

/**
 * Distraction-free reading toggle. Adds a body class that hides the site header
 * and any element marked `data-focus-hide` (breadcrumb, study tabs), leaving just
 * the matn and translation. Persisted so focus carries across hadith navigation;
 * exposed as a small fixed button that's always reachable.
 */
export function FocusMode() {
  const [on, setOn] = useState(false);

  // Restore on mount.
  useEffect(() => {
    const saved = (() => {
      try {
        return localStorage.getItem(STORAGE_KEY) === "1";
      } catch {
        return false;
      }
    })();
    setOn(saved);
  }, []);

  // Apply to <body> and persist whenever it changes; always clean up on unmount.
  useEffect(() => {
    document.body.classList.toggle("reading-focus", on);
    try {
      localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch {
      /* ignore */
    }
    return () => document.body.classList.remove("reading-focus");
  }, [on]);

  // Escape exits focus.
  useEffect(() => {
    if (!on) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOn(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [on]);

  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      aria-pressed={on}
      className="fixed bottom-5 right-5 z-50 rounded-full border border-white/15 bg-indigo-navy/90 px-4 py-2 text-sm text-ivory/80 shadow-lg backdrop-blur hover:border-amber-node/60 hover:text-amber-node"
    >
      {on ? "✕ Exit focus" : "◯ Focus"}
    </button>
  );
}
