"use client";

import { useReaderSettings } from "@/lib/hooks/useReaderSettings";
import { READING_THEME_CLASS } from "@/lib/readingTheme";

/**
 * Renders the translation(s) the reader has chosen (English / Indonesian / both),
 * constrained to a comfortable reading measure (~68ch). Shares the reading-surface
 * theme with the matn panel so Night/Sepia/Paper changes the whole reading area.
 * Falls back gracefully when a chosen language isn't available — never silently blank.
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
  const { translationLang, matnTheme } = useReaderSettings();
  const showEn = translationLang === "en" || translationLang === "both";
  const showId = translationLang === "id" || translationLang === "both";

  const enMissing = showEn && !en;
  const idMissing = showId && !id;
  const fallbackToEn = translationLang === "id" && !id && !!en;
  const fallbackToId = translationLang === "en" && !en && !!id;

  const panel = `max-w-[68ch] rounded-xl border p-5 transition-colors ${READING_THEME_CLASS[matnTheme]}`;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(showEn || fallbackToEn) && (
        <div className={panel}>
          <h3 className="mb-2 font-crimson text-amber-node">English</h3>
          {en ? (
            <p className="leading-relaxed">{en}</p>
          ) : (
            <p className="text-sm opacity-50">English translation not yet available.</p>
          )}
          {en && enSource && <p className="mt-2 text-xs opacity-50">Source: {enSource}</p>}
          {fallbackToEn && (
            <p className="mt-1 text-xs opacity-50">Indonesian not available — showing English.</p>
          )}
        </div>
      )}
      {(showId || fallbackToId) && (
        <div className={panel}>
          <h3 className="mb-2 font-crimson text-amber-node">Indonesian</h3>
          {id ? (
            <p className="leading-relaxed">{id}</p>
          ) : (
            <p className="text-sm opacity-50">Indonesian translation not yet available.</p>
          )}
          {id && idSource && <p className="mt-2 text-xs opacity-50">Source: {idSource}</p>}
          {fallbackToId && (
            <p className="mt-1 text-xs opacity-50">English not available — showing Indonesian.</p>
          )}
        </div>
      )}
      {translationLang === "both" && enMissing && idMissing && (
        <p className="text-sm text-ivory/40">No translation is available for this hadith yet.</p>
      )}
    </div>
  );
}
