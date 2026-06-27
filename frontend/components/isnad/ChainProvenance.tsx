type Tone = "warn" | "alert";

const BROKEN: Record<string, { label: string; blurb: string; tone: Tone }> = {
  mursal: {
    label: "Mursal",
    blurb:
      "A Successor (Tabi'i) narrates directly from the Prophet ﷺ — the Companion link is missing from this chain.",
    tone: "warn",
  },
  munqati: {
    label: "Munqati'",
    blurb: "There is a break in this chain — one or more narrators are missing.",
    tone: "alert",
  },
};

/**
 * Surfaces chain integrity (mursal / munqati') and a provenance disclaimer.
 * Chains are auto-extracted from the isnad text, so we never present them as
 * a verified reconstruction.
 */
export function ChainProvenance({ chainType }: { chainType?: string }) {
  const broken = chainType ? BROKEN[chainType] : undefined;
  const toneClass =
    broken?.tone === "alert"
      ? "border-grade-daif/40 bg-grade-daif/10 text-grade-daif"
      : "border-grade-hasan/40 bg-grade-hasan/10 text-grade-hasan";

  return (
    <div className="space-y-2">
      {broken && (
        <div className={`rounded-lg border p-3 text-sm ${toneClass}`}>
          <strong>{broken.label} chain.</strong> {broken.blurb}
        </div>
      )}
      <p className="text-xs text-ivory/40">
        This chain is auto-extracted from the isnad text and may contain parsing
        errors — verify against primary rijal sources before relying on it.
      </p>
    </div>
  );
}
