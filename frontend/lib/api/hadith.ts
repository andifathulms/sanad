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

export const getSanad = (id: number | string) =>
  api<SanadResponse>(`/hadiths/${id}/sanad/`);

export const getNarrator = (id: number | string) =>
  api<Narrator>(`/narrators/${id}/`);

export const searchHadiths = (params: {
  q: string;
  lang?: "ar" | "en" | "id";
  book?: string;
  grade?: string;
}) => api<Paginated<HadithListItem>>("/search/", { params });
