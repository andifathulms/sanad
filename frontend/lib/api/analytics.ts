import { api } from "./client";
import type {
  CentralNarrator,
  CorpusOverview,
  GradeDistribution,
  MutabiShahid,
  ParallelHadith,
  WordFrequency,
} from "./types";

/** Top narrators by precomputed betweenness centrality (network hubs). */
export const getNarratorCentrality = (top = 20) =>
  api<{ narrators: CentralNarrator[] }>("/analytics/narrator-centrality/", {
    params: { top },
  }).then((r) => r.narrators);

/** Frequency of an Arabic word across the corpus, optionally scoped to a book. */
export const getWordFrequency = (word: string, book?: string) =>
  api<WordFrequency>("/analytics/word-frequency/", {
    params: { word, book },
  });

/** Lightweight corpus-wide totals + grade breakdown for the dashboard. */
export const getCorpusOverview = () =>
  api<CorpusOverview>("/analytics/overview/");

/** Grade breakdown for one book (by slug) or the whole corpus when omitted. */
export const getGradeDistribution = (book?: string) =>
  api<GradeDistribution>("/analytics/grade-distribution/", {
    params: { book },
  });

/** Supporting narrations split into mutabi' (same companion) and shahid (different). */
export const getMutabiShahid = (hadithId: number | string) =>
  api<MutabiShahid>("/analytics/mutabi-shahid/", {
    params: { hadith_id: hadithId },
  });

/** Flat list of textually parallel narrations from the precomputed parallel table. */
export const getParallels = (hadithId: number | string) =>
  api<ParallelHadith[]>(`/hadiths/${hadithId}/parallels/`);
