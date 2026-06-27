import { api } from "./client";
import type {
  CorpusOverview,
  GradeDistribution,
  MutabiShahid,
  ParallelHadith,
} from "./types";

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
