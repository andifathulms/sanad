"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type MatnTheme = "night" | "sepia" | "paper";

export interface ReaderSettings {
  /** Arabic matn scale multiplier (1 = default). */
  arabicScale: number;
  /** Show diacritics on the Arabic matn. */
  showTashkeel: boolean;
  /** Background treatment for the reading surface. */
  matnTheme: MatnTheme;
  /** Append classical honorifics (RA / rh) to narrator names. */
  showHonorifics: boolean;
}

interface ReaderSettingsContext extends ReaderSettings {
  setArabicScale: (n: number) => void;
  toggleTashkeel: () => void;
  setMatnTheme: (t: MatnTheme) => void;
  toggleHonorifics: () => void;
}

const DEFAULTS: ReaderSettings = {
  arabicScale: 1,
  showTashkeel: true,
  matnTheme: "night",
  showHonorifics: true,
};

export const ARABIC_SCALES = [0.85, 1, 1.15, 1.3, 1.5];

const STORAGE_KEY = "sanad.reader.settings";

const Ctx = createContext<ReaderSettingsContext | null>(null);

export function ReaderSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULTS);

  // Hydrate from localStorage after mount (keeps SSR markup deterministic).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore corrupt/unavailable storage */
    }
  }, []);

  const update = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo<ReaderSettingsContext>(
    () => ({
      ...settings,
      setArabicScale: (n) => update({ arabicScale: n }),
      toggleTashkeel: () => update({ showTashkeel: !settings.showTashkeel }),
      setMatnTheme: (t) => update({ matnTheme: t }),
      toggleHonorifics: () => update({ showHonorifics: !settings.showHonorifics }),
    }),
    [settings, update],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReaderSettings(): ReaderSettingsContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useReaderSettings must be used within ReaderSettingsProvider");
  return ctx;
}
