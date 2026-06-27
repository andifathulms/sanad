/** Browser-side auth + authenticated mutations against the same-origin /api proxy. */
import { getAccessToken } from "@/lib/auth/token";
import type { HadithListItem } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api/v1";

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      /* ignore */
    }
    throw new AuthError(res.status, detail);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export const login = (username: string, password: string) =>
  request<TokenPair>("/auth/token/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const register = (data: {
  username: string;
  email: string;
  password: string;
  preferred_locale?: string;
}) =>
  request("/auth/register/", { method: "POST", body: JSON.stringify(data) });

export const me = () => request<{ id: number; username: string; email: string }>("/auth/me/");

// --- Bookmarks ---
export interface Bookmark {
  id: number;
  hadith: number;
  note: string;
  created_at: string;
}

export const listBookmarks = () =>
  request<{ results: Bookmark[] }>("/bookmarks/").then((r) => r.results);

export const addBookmark = (hadithId: number, note = "") =>
  request<Bookmark>("/bookmarks/", {
    method: "POST",
    body: JSON.stringify({ hadith: hadithId, note }),
  });

export const removeBookmark = (bookmarkId: number) =>
  request<void>(`/bookmarks/${bookmarkId}/`, { method: "DELETE" });

// --- Reading history ---
export interface ReadingHistoryEntry {
  id: number;
  hadith: number;
  hadith_detail: HadithListItem;
  read_at: string;
}

export const listHistory = () =>
  request<{ results: ReadingHistoryEntry[] }>("/history/").then((r) => r.results);

/** Best-effort: record that the current user opened a hadith. */
export const recordHistory = (hadithId: number) =>
  request<ReadingHistoryEntry>("/history/", {
    method: "POST",
    body: JSON.stringify({ hadith: hadithId }),
  });

// --- Collections ---
export interface CollectionItem {
  id: number;
  hadith: number;
  hadith_detail: HadithListItem;
  position: number;
  added_at: string;
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  items: CollectionItem[];
  created_at: string;
}

export const listCollections = () =>
  request<{ results: Collection[] }>("/collections/").then((r) => r.results);

export const createCollection = (data: {
  name: string;
  description?: string;
  is_public?: boolean;
}) =>
  request<Collection>("/collections/", {
    method: "POST",
    body: JSON.stringify(data),
  });
