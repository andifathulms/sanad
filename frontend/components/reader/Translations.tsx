"use client";

import { useReaderSettings } from "@/lib/hooks/useReaderSettings";

/**
 * Renders the translation(s) the reader has chosen (English / Indonesian / both),
 * constrained to a comfortable reading measure (~68ch). Falls back gracefully when
 * a chosen language isn't available for this hadith — never silently blank.
 */
export function Translations({
  en,
  id,
  enSource,
  idSource,
}: {
  en: string;
  id: string;
  enSource?: string;
  idSource?: string;
}) {
  const { translationLang } = useReaderSettings();
  const showEn = translationLang === "en" || translationLang === "both";
  const showId = translationLang === "id" || translationLang === "both";

  // If the chosen single language is missing, fall back to the other one.
  const enMissing = showEn && !en;
  const idMissing = showId && !id;
  const fallbackToEn = translationLang === "id" && !id && !!en;
  const fallbackToId = translationLang === "en" && !en && !!id;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(showEn || fallbackToEn) && (
        <div className="surface max-w-[68ch] p-5">
          <h3 className="mb-2 font-crimson text-amber-node">English</h3>
          {en ? (
            <p className="leading-relaxed text-ivory/85">{en}</p>
          ) : (
            <p className="text-sm text-ivory/40">English translation not yet available.</p>
          )}
          {en && enSource && (
            <p className="mt-2 text-xs text-ivory/40">Source: {enSource}</p>
          )}
          {fallbackToEn && (
            <p className="mt-1 text-xs text-ivory/40">
              Indonesian not available — showing English.
            </p>
          )}
        </div>
      )}
      {(showId || fallbackToId) && (
        <div className="surface max-w-[68ch] p-5">
          <h3 className="mb-2 font-crimson text-amber-node">Indonesian</h3>
          {id ? (
            <p className="leading-relaxed text-ivory/85">{id}</p>
          ) : (
            <p className="text-sm text-ivory/40">Indonesian translation not yet available.</p>
          )}
          {id && idSource && (
            <p className="mt-2 text-xs text-ivory/40">Source: {idSource}</p>
          )}
          {fallbackToId && (
            <p className="mt-1 text-xs text-ivory/40">
              English not available — showing Indonesian.
            </p>
          )}
        </div>
      )}
      {/* Both chosen languages missing — surface a single clear note. */}
      {translationLang === "both" && enMissing && idMissing && (
        <p className="text-sm text-ivory/40">No translation is available for this hadith yet.</p>
      )}
    </div>
  );
}
