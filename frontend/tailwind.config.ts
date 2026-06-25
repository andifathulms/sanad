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
        amber: { node: "#E2B96F" }, // Thiqah / reliable narrator nodes
        crimson: { node: "#C0392B" }, // Da'if narrator nodes
        slate: { node: "#7F8C8D" }, // Majhul / unknown
        ivory: "#F8F4EE", // light mode background
        // Grading color system (consistent app-wide)
        grade: {
          sahih: "#27AE60",
          hasan: "#F39C12",
          daif: "#E74C3C",
          maudu: "#8E44AD",
          unknown: "#7F8C8D",
        },
        reliability: {
          thiqah: "#27AE60",
          saduq: "#F39C12",
          daif: "#E74C3C",
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
