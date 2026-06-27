import type { Config } from "tailwindcss";

/**
 * "The Scholar's Map" design language (PRD §8).
 * Palette + grading colors are shared verbatim with the backend graph engine.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        indigo: {
          deep: "#1A1A2E", // primary background
          navy: "#16213E", // secondary surfaces
          scholar: "#0F3460", // primary accent
        },
        amber: { node: "#E2B96F" }, // brand accent (gold)
        crimson: { node: "#C0392B" }, // reserved alert red
        slate: { node: "#7F8C8D" }, // Majhul / unknown
        ivory: "#F8F4EE", // light mode background
        // Grading colour system (single source of truth: lib/grading.ts).
        // Semantics: green=authentic, teal=acceptable, amber=weak, purple=fabricated.
        grade: {
          sahih: "#27AE60",
          hasan: "#2D9C8F",
          daif: "#E08A2E",
          maudu: "#8E44AD",
          unknown: "#7F8C8D",
        },
        reliability: {
          thiqah: "#27AE60",
          saduq: "#2D9C8F",
          daif: "#E08A2E",
          majhul: "#7F8C8D",
          matruk: "#8E44AD",
          unknown: "#95A5A6",
        },
      },
      fontFamily: {
        amiri: ["Amiri", "serif"], // Arabic
        crimson: ["'Crimson Pro'", "serif"], // display
        inter: ["Inter", "sans-serif"], // body / UI
        mono: ["'JetBrains Mono'", "monospace"], // data
        plexar: ["'IBM Plex Sans Arabic'", "sans-serif"], // graph labels
      },
    },
  },
  plugins: [],
};

export default config;
