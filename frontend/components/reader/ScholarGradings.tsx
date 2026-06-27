import { GradeBadge } from "@/components/reader/GradeBadge";
import type { ScholarGrading } from "@/lib/api/types";

/** True when recorded scholars assigned more than one distinct grade. */
export function scholarsDiffer(gradings: ScholarGrading[]): boolean {
  return new Set(gradings.map((g) => g.grade)).size > 1;
}

/**
 * Lists each classical scholar's grade for a hadith. Renders nothing when no
 * per-scholar gradings are recorded (the single GradeBadge still shows above).
 */
export function ScholarGradings({ gradings }: { gradings: ScholarGrading[] }) {
  if (!gradings || gradings.length === 0) return null;
  return (
    <div className="surface space-y-3 p-5">
      <div className="flex items-center gap-3">
        <h3 className="font-crimson text-amber-node">Scholarly gradings</h3>
        {scholarsDiffer(gradings) && (
          <span className="rounded-full bg-grade-hasan/15 px-2.5 py-0.5 text-xs text-grade-hasan">
            Scholars differ
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {gradings.map((g) => (
          <li key={`${g.scholar}-${g.grade}`} className="flex flex-wrap items-center gap-2">
            <GradeBadge grade={g.grade} source={g.scholar} />
            <span className="text-sm text-ivory/80">{g.scholar}</span>
            {g.source && <span className="text-xs text-ivory/40">· {g.source}</span>}
            {g.notes && <span className="w-full text-xs text-ivory/50">{g.notes}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
