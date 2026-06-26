import { api } from "./client";
import type { HadithListItem, Narrator, Paginated } from "./types";

export interface CompareResult {
  chain1: number[];
  chain2: number[];
  shared_narrators: number[];
  divergence_point: number | null;
}

export const searchNarrators = (params: {
  q?: string;
  generation?: string;
  reliability_grade?: string;
  page?: number;
}) => api<Paginated<Narrator>>("/narrators/search/", { params });

export const getNarratorTeachers = (id: number | string) =>
  api<Narrator[]>(`/narrators/${id}/teachers/`);

export const getNarratorStudents = (id: number | string) =>
  api<Narrator[]>(`/narrators/${id}/students/`);

export const getNarratorHadiths = (id: number | string, page = 1) =>
  api<Paginated<HadithListItem>>(`/narrators/${id}/hadiths/`, { params: { page } });

export const compareIsnad = (hadith1: number, hadith2: number) =>
  api<CompareResult>("/isnad/compare/", { params: { hadith1, hadith2 } });
