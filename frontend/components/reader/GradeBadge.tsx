import type { Grade } from "@/lib/api/types";

const GRADE_COLORS: Record<Grade, string> = {
  sahih: "#27AE60",
  hasan: "#F39C12",
  daif: "#E74C3C",
  maudu: "#8E44AD",
  unknown: "#7F8C8D",
};

const GRADE_LABELS: Record<Grade, string> = {
  sahih: "Sahih",
  hasan: "Hasan",
  daif: "Da'if",
  maudu: "Maudu'",
  unknown: "Unknown",
};

/**
 * Always shown with the grading hadith context. The platform NEVER asserts its own
 * grade — the source scholar is surfaced in the tooltip (CLAUDE.md grading rules).
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
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {GRADE_LABELS[grade]}
    </span>
  );
}
