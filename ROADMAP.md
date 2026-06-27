# Sanad — Product & Scholarly Roadmap

> A senior-PM + Islamic-scholar review of what to improve and what to add next.
> **Guiding insight:** the backend has already shipped most of the analytics and
> isnad-intelligence layer — but the frontend exposes only a fraction of it. The
> highest-ROI work right now is *surfacing finished value*, not building new systems.

---

## 0. The core finding — stranded backend value

Six analytics endpoints (plus parallels, reading-history, and collections) are
live, cached, and reachable, with **no frontend surface**. This is real,
completed capability that users cannot reach.

| Built in backend (working API) | Exposed in frontend? |
|---|---|
| `GET /analytics/grade-distribution/` | ❌ No UI |
| `GET /analytics/word-frequency/` | ❌ No UI |
| `GET /analytics/matn-similarity/` (pg_trgm parallels) | ❌ No UI |
| `GET /analytics/mutabi-shahid/` | ❌ No UI |
| `GET /analytics/narrator-centrality/` | ❌ No UI |
| `GET /analytics/overview/` (corpus stats) | ❌ No UI |
| `GET /hadiths/{id}/parallels/` | ❌ No UI (`has_parallel` flag unused) |
| `GET /hadiths/{id}/quran-refs/` | ❌ No UI (and no data populated) |
| Reader, search, isnad graph, narrator profiles, network, path, compare | ✅ Yes |

The `/analyze` and `/tools` route areas promised in the PRD barely exist — only
`/analyze/network` is built. There is no word-analysis tool, grade explorer,
corpus dashboard, or mutabi'/shahid finder UI.

> **Prerequisite for Sprint 1:** verify the analytics tables are populated —
> i.e. `compute_stats` and `compute_similarity` have run. If they are empty,
> the new pages will render blank. Confirm with e.g.
> `curl /api/v1/analytics/overview/` before scheduling UI work.

---

## Part A — Features needing improvement

Ranked by impact, weighted toward surfacing stranded value.

### A1. Light up the `/analyze` + `/tools` surfaces — *highest ROI*
Endpoints exist and are cached; this is mostly view + page work.
- **Grade Distribution Explorer** (`/analyze/grades`) — per-book Sahih/Hasan/Da'if/Maudu' bars from `grade-distribution/`. Answers "what % of Bukhari is sahih?"
- **Word Frequency tool** (`/analyze/word`) — Arabic word → corpus count + per-book distribution from `word-frequency/` (materialized view already built).
- **Corpus Overview dashboard** — totals + grade breakdown from `analytics/overview/`. Today `/dashboard` only lists bookmarks.
- **Parallels + Mutabi'/Shahid panel** on the hadith detail page — "This hadith is also narrated in…" with similarity scores, via `parallels/` and `mutabi-shahid/`.
- **Top-Narrators (centrality) leaderboard** — from `narrator-centrality/`, linking to profiles.

### A2. Reliability-grade coverage & honesty of attribution — *scholarly integrity*
`seed_narrator_grades` applies a curated seed list; most narrators stay
`unknown`/`majhul`, yet the UI shows a colored reliability dot that can imply a
verdict.
- Add a **coverage indicator**: distinguish "graded by [rijal source]" from "not yet assessed." A default color must never read as an assessment.
- Always show `bio_source`/attribution beside a grade. Reinforces the rule: the platform never asserts a grade itself.

### A3. Isnad extraction accuracy & narrator de-duplication — *scholarly integrity*
Chains are regex-parsed from `matn_arabic` (`extraction.py`); narrators are
de-duped by a normalized-name key. Two risks for a religious corpus:
- **Conflation** — distinct narrators with similar names merged into one node, corrupting the graph, centrality, path, and compare results.
- **Mis-segmentation** — transmission verbs inside the matn body misread as chain boundaries.
- **Improvements:** a visible **provenance disclaimer** on isnad views ("chain auto-extracted; verify against primary sources"); surface `chain_type` for **mursal/munqati'** (broken) chains; a QA spot-check workflow against sunnah.com for high-traffic hadiths.

### A4. Multi-scholar grading display
`Hadith.grade` is a single field. When Al-Albani and Ibn Hajar disagree there is
no way to show it. Add a "Scholars differ" affordance and storage for alternate
gradings.

### A5. Indonesian translation completeness & site i18n
Many `translation_id` rows are empty (UI falls back to English with a note).
For the stated **Indonesian-first** audience, audit gadingnst coverage and add a
second source if needed. Also: there is **no site-UI language switcher** — the
chrome is English-only.

### A6. Reader filtering & mobile/responsive
The grade filter exists in the API but isn't wired into book-browse. No mobile
nav; D3/React-Flow canvases are hard to use on touch. Add reader grade/chapter
filters and a mobile layout pass.

---

## Part B — Nice-to-add features

### B1. Quran ↔ Hadith bridge — *flagship differentiator, half-built*
`HadithQuranRef` model + `quran-refs/` endpoint exist, but there is **no
population script and no UI**. Needs a verse-link curation source + a "Related
Quran verses" panel on hadith detail (and the reciprocal in Quranlytics).

### B2. Topic / thematic browse — *`semantic` app is models-only*
`Topic` + `HadithTopic` exist with no endpoints. A curated topic browser
(Prayer, Fasting, Trade…) is achievable **without** AI by populating curated
tags first; embedding search is the later stretch.

### B3. Shareable hadith card generator — *growth / da'wah persona*
PNG export of Arabic + translation + grade badge. High virality; pure frontend.

### B4. Personal layer — *more stranded value*
`ReadingHistory`, `Collection`, `CollectionItem` are fully built and exposed, but
the frontend shows only bookmarks. Surface reading history/streak, collections,
and a "My Narrator Journey" view.

### B5. Takhrij & Tabaqah tools — *scholar value*
- **Takhrij view** — trace one hadith across all books via the parallels graph.
- **Tabaqah timeline** — narrator active-years on an Islamic-history axis (birth/death AH already stored).
- **'Illah notes** — display field for classical defect notes.

---

## Sprint roadmap

**Sprint 1 — "Light up the backend"** (stranded value, low effort / high impact)
1. Hadith-detail Parallels + Mutabi'/Shahid panel (A1)
2. Grade Distribution Explorer `/analyze/grades` (A1)
3. Corpus Overview on `/dashboard` (A1)
4. Collections + reading-history UI (B4)

**Sprint 2 — "Analysis tools"**
5. Word Frequency tool `/analyze/word` (A1)
6. Top-Narrators centrality widget (A1)
7. Reader grade/chapter filters + mobile pass (A6)

**Sprint 3 — "Scholarly integrity hardening"**
8. Grade-coverage honesty + attribution everywhere (A2)
9. Isnad provenance disclaimer + mursal/munqati' surfacing + QA spot-checks (A3)
10. Multi-scholar grading model + display (A4)

**Sprint 4 — "Differentiators"**
11. Quran↔Hadith bridge: population + UI (B1)
12. Curated topic browser (B2)
13. Shareable hadith card export (B3)

**Backlog:** Takhrij view, Tabaqah timeline, 'Illah notes, Indonesian coverage
audit, site-wide i18n switcher, semantic/embedding search.

---

## Reference — files touched by this roadmap

- Backend analytics: `backend/apps/analytics/views.py`, `services.py`, `tasks.py`
- Isnad integrity: `backend/apps/isnad/extraction.py`, `seed_narrator_grades.py`, `reliability_seed.py`
- Stubs to finish: `backend/apps/hadith/models.py` (`HadithQuranRef`), `backend/apps/semantic/models.py`
- Frontend gaps: `frontend/app/analyze/` (only `network/` exists), `frontend/app/dashboard/page.tsx`, `frontend/app/reader/[book]/[hadith]/page.tsx`
- API clients to extend: `frontend/lib/api/*.ts`
