import { GRADE_COLORS, GRADE_LABELS } from "@/lib/grading";
import type { Grade, GradeDistribution } from "@/lib/api/types";

const ORDER: Grade[] = ["sahih", "hasan", "daif", "maudu", "unknown"];

/** A single stacked horizontal bar of a grade distribution, with a legend row. */
export function GradeBar({ dist }: { dist: GradeDistribution }) {
  const total = ORDER.reduce((sum, g) => sum + (dist[g] ?? 0), 0);
  if (total === 0) {
    return <p className="text-sm text-ivory/40">No graded hadiths recorded yet.</p>;
  }
  return (
    <div className="space-y-2">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-ivory/5">
        {ORDER.map((g) => {
          const pct = ((dist[g] ?? 0) / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={g}
              style={{ width: `${pct}%`, backgroundColor: GRADE_COLORS[g] }}
              title={`${GRADE_LABELS[g]}: ${dist[g]} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ivory/60">
        {ORDER.map((g) =>
          (dist[g] ?? 0) > 0 ? (
            <span key={g} className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: GRADE_COLORS[g] }}
              />
              {GRADE_LABELS[g]} {dist[g]}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}
