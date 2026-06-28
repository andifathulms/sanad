import type { MatnTheme } from "@/lib/hooks/useReaderSettings";

/**
 * Background + text treatment for the reading surface, shared by the matn panel
 * and the translation panels so switching theme changes the whole reading area
 * coherently (not just the Arabic box).
 */
export const READING_THEME_CLASS: Record<MatnTheme, string> = {
  night: "border-white/5 bg-indigo-navy text-ivory",
  sepia: "border-[#e0d4b8] bg-[#f4ecd8] text-[#3a2e1f]",
  paper: "border-black/10 bg-white text-[#1a1a1a]",
};
