import { api } from "./client";
import type { MutabiShahid, ParallelHadith } from "./types";

/** Supporting narrations split into mutabi' (same companion) and shahid (different). */
export const getMutabiShahid = (hadithId: number | string) =>
  api<MutabiShahid>("/analytics/mutabi-shahid/", {
    params: { hadith_id: hadithId },
  });

/** Flat list of textually parallel narrations from the precomputed parallel table. */
export const getParallels = (hadithId: number | string) =>
  api<ParallelHadith[]>(`/hadiths/${hadithId}/parallels/`);
