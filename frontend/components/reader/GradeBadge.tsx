import type { Grade } from "@/lib/api/types";
import { GRADE_ABBR, GRADE_COLORS, GRADE_LABELS } from "@/lib/grading";

// Re-exported for the many components that already import the palette from here.
export { GRADE_COLORS, GRADE_LABELS };

/**
 * Always shown with the grading hadith context. The platform NEVER asserts its own
 * grade — the source scholar is surfaced on hover/tap (CLAUDE.md grading rules).
 * The abbreviation glyph keeps the grade legible without relying on colour alone.
 */
export function GradeBadge({ grade, source }: { grade: Grade; source?: string }) {
  const color = GRADE_COLORS[grade];
  const tooltip = source ? `According to: ${source}` : "Grading source not recorded";
  return (
    <span
      title={tooltip}
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
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
    </span>
  );
}
