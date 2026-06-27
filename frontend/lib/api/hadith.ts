import { api } from "./client";
import type {
  Book,
  Chapter,
  HadithDetail,
  HadithListItem,
  Narrator,
  Paginated,
  SanadResponse,
} from "./types";

// The list endpoint is DRF-paginated; unwrap to the books array.
export const getBooks = () =>
  api<Paginated<Book>>("/books/", { params: { page: 1 } }).then((r) => r.results);

export const getBook = (slug: string) => api<Book>(`/books/${slug}/`);

export const getChapters = (slug: string) =>
  api<Chapter[]>(`/books/${slug}/chapters/`);

export const getBookHadiths = (
  slug: string,
  params?: { chapter?: number; grade?: string; page?: number },
) => api<Paginated<HadithListItem>>(`/books/${slug}/hadiths/`, { params });

export const getHadith = (id: number | string) =>
  api<HadithDetail>(`/hadiths/${id}/`);

export interface HadithNeighborRef {
  id: number;
  global_reference: string;
  number_in_book: number;
  book_slug: string;
}

export const getHadithNeighbors = (id: number | string) =>
  api<{ prev: HadithNeighborRef | null; next: HadithNeighborRef | null }>(
    `/hadiths/${id}/neighbors/`,
  );

export const getSanad = (id: number | string) =>
  api<SanadResponse>(`/hadiths/${id}/sanad/`);

export const getNarrator = (id: number | string) =>
  api<Narrator>(`/narrators/${id}/`);

export const searchHadiths = (params: {
  q: string;
  lang?: "ar" | "en" | "id";
  book?: string;
  grade?: string;
  page?: number;
}) => api<Paginated<HadithListItem>>("/search/", { params });
