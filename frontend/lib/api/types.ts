export type Grade = "sahih" | "hasan" | "daif" | "maudu" | "unknown";
export type Reliability =
  | "thiqah"
  | "saduq"
  | "daif"
  | "majhul"
  | "matruk"
  | "unknown";

export interface Book {
  id: number;
  slug: string;
  name_arabic: string;
  name_en: string;
  name_id: string;
  author: string;
  author_arabic: string;
  author_death_ah: number | null;
  collection_type: string;
  total_hadiths: number;
  grade_summary: Record<string, number>;
}

export interface Chapter {
  id: number;
  number: number;
  title_arabic: string;
  title_en: string;
  title_id: string;
  hadith_count: number;
}

export interface HadithListItem {
  id: number;
  global_reference: string;
  book_slug: string;
  number_in_book: number;
  matn_arabic: string;
  translation_en: string;
  translation_id: string;
  grade: Grade;
  grade_source: string;
  has_parallel: boolean;
}

export interface HadithDetail extends HadithListItem {
  alt_reference: string;
  book: Book;
  chapter: Chapter | null;
  matn_clean: string;
  grade_notes: string;
  chain_type: string;
  source_api: string;
  quran_refs: { surah_number: number; verse_number: number; relevance_type: string }[];
}

export interface Narrator {
  id: number;
  name_arabic: string;
  name_transliteration: string;
  name_en: string;
  kunya: string;
  generation: string;
  reliability_grade: Reliability;
  death_year_ah: number | null;
  total_hadiths: number;
  centrality_score: number;
}

export interface ChainNarrator {
  position: number;
  narrator: Narrator;
}

export interface SanadResponse {
  chain: ChainNarrator[];
  graph_data: {
    nodes: { id: string; data: Record<string, unknown> }[];
    edges: { id: string; source: string; target: string }[];
  };
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
