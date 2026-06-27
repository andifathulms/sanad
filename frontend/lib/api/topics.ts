import { api } from "./client";
import type { HadithListItem, Paginated, Topic } from "./types";

/** All curated topics with hadith counts (unpaginated). */
export const getTopics = () => api<Topic[]>("/topics/");

/** Paginated hadiths curated under a topic. */
export const getTopicHadiths = (slug: string, page = 1) =>
  api<Paginated<HadithListItem>>(`/topics/${slug}/hadiths/`, { params: { page } });
