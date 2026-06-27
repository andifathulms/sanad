"use client";

import { useEffect, useRef, useState } from "react";
import type { Grade } from "@/lib/api/types";
import { GRADE_ABBR, GRADE_COLORS, GRADE_LABELS } from "@/lib/grading";

// Re-exported for the many components that already import the palette from here.
export { GRADE_COLORS, GRADE_LABELS };

/**
 * Always shown with the grading context. The platform NEVER asserts its own grade —
 * the source scholar is surfaced via an accessible popover that opens on tap, click
 * OR keyboard focus (a plain `title` tooltip is invisible on touch devices, where the
 * attribution CLAUDE.md requires would otherwise be unreachable). The abbreviation
 * glyph keeps the grade legible without relying on colour alone.
 */
export function GradeBadge({ grade, source }: { grade: Grade; source?: string }) {
  const color = GRADE_COLORS[grade];
  const attribution = source ? `According to: ${source}` : "Grading source not recorded";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-expanded={open}
        aria-label={`Grade: ${GRADE_LABELS[grade]}. ${attribution}`}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-node"
        style={{ backgroundColor: `${color}22`, color }}
      >
        <span
          className="grid h-3.5 w-3.5 place-items-center rounded-full text-[9px] font-bold leading-none text-indigo-deep"
          style={{ backgroundColor: color }}
          aria-hidden
        >
          {GRADE_ABBR[grade]}
        </span>
        {GRADE_LABELS[grade]}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute right-0 top-full z-20 mt-1 w-max max-w-[16rem] rounded-lg border border-white/10 bg-indigo-navy px-3 py-1.5 text-xs text-ivory/85 shadow-lg"
        >
          {attribution}
        </span>
      )}
    </span>
  );
}
