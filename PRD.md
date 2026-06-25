# PRD — Sanad: Hadith Intelligence Platform

## Overview

**Product Name:** Sanad (سند)
**Tagline:** *"Every hadith has a chain. Now you can see it."*
**Owner:** Andi Fathul Mukminin Salahuddin
**Stack:** Django + DRF · React/Next.js · PostgreSQL · Docker · GCP
**Companion to:** Quranlytics (shares design language + auth system)

### Why "Sanad"?
Sanad (سند) means "chain of transmission" in Arabic — the backbone of hadith science. Every authentic hadith is backed by a sanad: a chain of narrators stretching back to the Prophet ﷺ. This name is the soul of the product.

---

## 1. Problem Statement

The Hadith corpus is the second pillar of Islamic knowledge after the Quran, yet it is far harder to navigate analytically. Existing platforms (sunnah.com, hadith.islam-db.com) are excellent readers but offer almost no tools for:

- Visualizing the isnad (narrator chain) as a network graph
- Understanding narrator reliability scores (jarh wa ta'dil)
- Tracking how a single topic is addressed across multiple books
- Spotting textual patterns, word frequencies, and matn (text) similarities
- Cross-referencing a hadith with its Quranic context

Sanad fills this gap: a full Hadith reader + deep analytical layer, the Quranlytics equivalent for the Sunnah.

---

## 2. Target Users

| Persona | Goal |
|---|---|
| **Muslim students & general readers** | Read hadith with full context and grading |
| **Islamic scholars & researchers** | Isnad analysis, narrator verification, cross-book comparison |
| **Da'wah creators & educators** | Find hadiths by topic, export shareable cards |
| **Hadith science students (Ulumul Hadith)** | Study sanad chains, rijal, jarh wa ta'dil interactively |
| **Quranlytics users** | Natural companion — cross-reference Quran ↔ Hadith |

**Primary locale:** Indonesian + English
**Secondary locale:** Arabic (display only)

---

## 3. Data Sources

```
Primary corpus:
  fawazahmed0/hadith-api     — SQLite dump, all major books, Arabic + EN
  gadingnst/hadith-api       — Indonesian translations (9 books)
  sunnah.com API             — Narrator metadata, grading (API key required)

Books covered:
  Kutub al-Sittah (The Six):
    - Sahih Bukhari       (7,563 hadiths)
    - Sahih Muslim        (7,563 hadiths)
    - Sunan Abu Dawud     (5,274 hadiths)
    - Jami al-Tirmidhi    (3,956 hadiths)
    - Sunan al-Nasa'i     (5,758 hadiths)
    - Sunan Ibn Majah     (4,341 hadiths)

  Additional:
    - Muwatta Malik       (1,832 hadiths)
    - Musnad Ahmad        (27,000+ hadiths) — Phase 2
    - Riyadh al-Salihin  (1,896 hadiths)   — curated reader favourite

Total corpus: ~62,000+ hadiths (Kutub al-Sittah + extras)
```

---

## 4. Core Feature Areas

### 4.1 — Hadith Reader (Foundation Layer)

- Browse by book → chapter → hadith
- Arabic matn (text) with full tashkeel
- Side-by-side: English + Indonesian translations
- Hadith grading badge: Sahih / Hasan / Da'if / Maudu' (color-coded)
- Narrator chain (sanad) displayed inline, each narrator is a clickable link
- Reference numbers: Book number, Hadith number, in-book reference
- Bookmarks, highlights, personal notes
- Cross-reference panel: "This hadith is also in..." (parallel narrations)
- Quick link: "Related Quran verses" (cross-reference to Quranlytics)

### 4.2 — Isnad (Chain) Visualizer 🔑

The flagship feature — what no other platform offers interactively.

**Chain Graph View**
- Every hadith's sanad rendered as a directed graph: Prophet ﷺ → Companion → Tabi'i → ... → Collector
- Node = narrator, edge = "narrated from"
- Node color = reliability grade (Thiqah = green, Da'if = red, Majhul = grey)
- Click any node → Narrator Profile Card

**Narrator Profile Card**
- Full name (Arabic + transliteration)
- Birth/death year (AH + CE)
- Generation (Sahabi / Tabi'i / Tabi' al-Tabi'in / etc.)
- Reliability assessment: collected from classical rijal books
- Teachers (narrated from) and Students (narrated to) — also clickable
- All hadiths this narrator appears in — paginated list

**Sanad Comparison**
- Select 2 hadiths on the same topic → overlay their chains side by side
- Highlight shared narrators (where chains converge)
- Identify the point of divergence

**Narrator Network Graph (Global)**
- Full network of all narrators in the corpus
- Filter by: book, generation, region, reliability
- Shortest path between any two narrators
- Centrality analysis: most-cited narrators (hub nodes)

### 4.3 — Matn (Text) Analysis Engine

**Word Frequency**
- Search any Arabic word → frequency across all 62,000 hadiths
- Per-book distribution heatmap
- Which chapter/topic it appears in most

**Hadith Similarity**
- Enter any hadith → find textually similar hadiths across all books
- Useful for finding parallel narrations (mutabi' / shahid)
- Similarity score based on matn comparison (not sanad)

**Topic Clustering**
- Browse hadiths by topic: Prayer, Fasting, Trade, Family, Jihad, etc.
- AI-assisted: type a concept → get ranked relevant hadiths
- "This topic in the Quran" cross-reference

**Matn Pattern Analysis**
- Prophetic speech patterns: recurring phrases, opening formulas
- "Whoever does X will get Y" pattern finder
- Conditional vs declarative hadith distribution per book

**Keyword Co-occurrence**
- Which concepts appear together in hadiths?
- e.g. ذكر (remembrance) + قلب (heart) — in which books, how often

### 4.4 — Hadith Science (Ulumul Hadith) Tools

**Grading Explorer**
- Filter all hadiths by grade across books
- Compare how different scholars graded the same hadith
- Visual: grade distribution per book (Sahih % vs Hasan % vs Da'if %)

**Rijal Encyclopedia**
- Searchable database of all narrators in the corpus
- Filter by: generation (tabaqah), region, reliability, teacher/student
- Timeline view: narrator active years overlaid on Islamic history

**Mutabi' & Shahid Finder**
- Given a hadith, find supporting narrations (mutabi': same chain level, shahid: different companion)
- Critical for advanced hadith authentication research

**'Illah Detector (Defect Analysis)**
- Flag hadiths with known hidden defects ('illah)
- Display classical scholars' notes on problematic narrations

### 4.5 — Cross-Platform Intelligence

**Quran ↔ Hadith Bridge**
- On any Quran verse (in Quranlytics): "Related Hadiths" panel
- On any Hadith (in Sanad): "Related Quran verses" panel
- Shared authentication — one account works on both platforms

**Hadith ↔ Fiqh Context**
- Which madhab (school of law) uses this hadith and how?
- Linked to relevant fiqh rulings (read-only, curated)

### 4.6 — Personal & Sharing Features

- Reading history + streak
- Personal hadith collection (custom lists)
- Shareable hadith card generator (Arabic + translation + grading, PNG export)
- "My Narrator Journey" — narrators you've explored, visualized as your personal network

---

## 5. Data Architecture

### PostgreSQL Schema

```
book
  id, name_arabic, name_en, name_id, author, author_arabic,
  total_hadiths, grade_summary (jsonb), collection_type

chapter
  id, book_id, number, title_arabic, title_en, title_id, hadith_count

hadith
  id, book_id, chapter_id
  number_in_book, global_reference
  matn_arabic          -- full Arabic text with tashkeel
  matn_clean           -- Arabic without tashkeel (for search)
  translation_en       -- English
  translation_id       -- Indonesian
  grade                -- sahih | hasan | daif | maudu | unknown
  grade_source         -- who graded it (Bukhari, Albani, etc.)
  has_parallel         -- boolean flag
  source_api           -- which API this came from

sanad
  id, hadith_id, chain_text_arabic, chain_text_en,
  chain_order (jsonb array of narrator_ids in order)

narrator
  id, name_arabic, name_transliteration, name_en
  kunya, laqab                              -- honorific, nickname
  birth_year_ah, death_year_ah
  birth_year_ce, death_year_ce
  generation                                -- sahabi/tabi'i/etc.
  region_of_origin
  reliability_grade                         -- thiqah/hasan/da'if/majhul
  reliability_notes    (text)
  bio_source                                -- which rijal book

narrator_link (isnad graph edges)
  id, teacher_id → narrator.id
  student_id    → narrator.id
  book_ids (jsonb)                          -- which books contain this edge
  hadith_count

hadith_narrator (many-to-many with position)
  hadith_id, narrator_id, position_in_chain

hadith_parallel
  hadith_id, parallel_hadith_id, similarity_score

hadith_quran_ref
  hadith_id, surah_number, verse_number, relevance_type

-- Materialized views
narrator_stats
  narrator_id, total_hadiths, books_appeared_in (jsonb),
  teacher_count, student_count, centrality_score

word_frequency_hadith
  lemma, total_count, per_book_distribution (jsonb)
```

### Indexing Strategy
- GIN index on `hadith.matn_arabic` for full-text Arabic search
- GIN index on `narrator_link` for fast graph traversal
- B-tree on `hadith.grade`, `hadith.book_id`, `narrator.reliability_grade`
- Trigram index (`pg_trgm`) on `narrator.name_arabic` for fuzzy name search
- Materialized view `narrator_stats` — recomputed nightly via Celery

---

## 6. Technical Architecture

```
┌─────────────────────────────────────────────────┐
│                  Next.js 14                     │
│  (App Router · TypeScript · Tailwind CSS)       │
│                                                 │
│  /reader/[book]/[hadith]  — Hadith reader       │
│  /isnad/[hadith_id]       — Chain visualizer    │
│  /narrator/[id]           — Narrator profile    │
│  /analyze/word            — Matn word analysis  │
│  /analyze/network         — Global narrator net │
│  /explore                 — Topic browser       │
│  /tools                   — Ulumul Hadith tools │
│  /dashboard               — Personal analytics  │
└─────────────────┬───────────────────────────────┘
                  │ REST
┌─────────────────▼───────────────────────────────┐
│              Django 5 + DRF                     │
│                                                 │
│  apps/hadith     — books, chapters, hadiths     │
│  apps/isnad      — narrators, chains, graph     │
│  apps/analytics  — frequency, similarity        │
│  apps/semantic   — AI topic search              │
│  apps/users      — auth (shared w/ Quranlytics) │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│           PostgreSQL 16                         │
│  + pg_trgm  + Full-text Arabic search           │
│  + Materialized views                           │
└─────────────────────────────────────────────────┘

Graph engine:
  NetworkX (Python)  — narrator network analysis (centrality, paths)
  React Flow         — frontend isnad graph rendering
  D3.js              — global narrator network (force-directed)

Additional:
  Redis    — analytics cache (24h TTL)
  Celery   — nightly stats recomputation
  GCP      — Cloud Run + Cloud SQL
```

---

## 7. API Design

### Reader APIs
```
GET /api/v1/books/
GET /api/v1/books/{id}/chapters/
GET /api/v1/books/{id}/hadiths/?chapter=&grade=&page=
GET /api/v1/hadiths/{id}/
GET /api/v1/hadiths/{id}/parallels/
GET /api/v1/hadiths/{id}/quran-refs/
GET /api/v1/search/?q=&lang=ar|en|id&book=&grade=
```

### Isnad APIs
```
GET /api/v1/hadiths/{id}/sanad/
    → { chain: [{ narrator, position, reliability }], graph_data: {...} }

GET /api/v1/narrators/{id}/
    → { profile, teachers, students, hadiths, stats }

GET /api/v1/narrators/{id}/network/?depth=2
    → { nodes: [...], edges: [...] }   ← for React Flow

GET /api/v1/narrators/search/?q=&generation=&reliability=

GET /api/v1/isnad/compare/?hadith1=&hadith2=
    → { chain1, chain2, shared_narrators, divergence_point }

GET /api/v1/network/global/?book=&generation=&limit=500
    → { nodes, edges }  ← for D3 force graph
```

### Analytics APIs
```
GET /api/v1/analytics/word-frequency/?word=&book=
    → { total, per_book: [...], sample_hadiths: [...] }

GET /api/v1/analytics/matn-similarity/?hadith_id=&threshold=0.7
    → { similar: [{ hadith_id, score, book }] }

GET /api/v1/analytics/topic/?q=natural+language+query
    → { hadiths: [...with relevance scores] }

GET /api/v1/analytics/grade-distribution/?book=
    → { sahih: N, hasan: N, daif: N, unknown: N }

GET /api/v1/analytics/narrator-centrality/?top=20
    → { narrators: [{ id, name, centrality_score, hadith_count }] }
```

---

## 8. UI/UX Direction

### Design Language: *"The Scholar's Map"*

Where Quranlytics is an illuminated manuscript, Sanad feels like an **academic research atlas** — precise, interconnected, authoritative. Think of classical Islamic manuscript marginalia meeting modern network visualization.

**Color Palette** (shares Quranlytics DNA, distinct identity):
- `#1A1A2E` — Deep Indigo (primary background — darker, more scholarly than Quranlytics)
- `#16213E` — Midnight Navy (secondary surfaces)
- `#0F3460` — Scholar Blue (primary accent)
- `#E2B96F` — Amber (narrator nodes — Thiqah/reliable, warm gold)
- `#C0392B` — Crimson (Da'if narrator nodes — clear warning)
- `#7F8C8D` — Slate (Majhul/unknown narrator nodes)
- `#F8F4EE` — Ivory (light mode background)

**Typography:**
- Arabic: `Amiri` (same as Quranlytics for consistency)
- Display: `Crimson Pro` (scholarly serif — different from Quranlytics' Playfair)
- Body/UI: `Inter`
- Data: `JetBrains Mono`
- Graph labels: `IBM Plex Sans Arabic` (optimized for Arabic in tight spaces)

**Signature Element:**
The **Living Chain** — when a hadith is opened, the sanad animates from the Prophet ﷺ downward, each narrator node appearing with a pulse in its reliability color (green → amber → red → grey), ending at the book collector. The chain feels alive, like a lineage tree being traced in real time.

**Grading Color System** (consistent across entire app):
```
Sahih  → #27AE60 (Emerald green)
Hasan  → #F39C12 (Amber)
Da'if  → #E74C3C (Crimson)
Maudu' → #8E44AD (Purple — fabricated)
Unknown→ #7F8C8D (Slate)
```

---

## 9. Phases

### Phase 1 — Reader Foundation (6 weeks)
- Data ingestion: all 6 kutub al-sittah + Muwatta + Riyadh al-Salihin
- Ingestion pipeline: fawazahmed0 SQLite → PostgreSQL + gadingnst for ID
- Hadith reader: Arabic + EN + ID translations + grading badges
- Book/chapter navigation + full-text search
- Basic sanad display (text, not yet graph)
- Bookmarks + notes

### Phase 2 — Isnad Visualizer (8 weeks)
- Narrator data ingestion (from sunnah.com API + manual curation)
- Narrator profile pages
- Sanad as interactive React Flow graph (per-hadith)
- Narrator search + filter
- Sanad comparison tool (2 hadiths side by side)

### Phase 3 — Analytics Engine (6 weeks)
- Word frequency analysis + per-book heatmap
- Hadith similarity engine (matn comparison)
- Grade distribution visualizer
- Narrator centrality analysis
- Mutabi' & shahid finder

### Phase 4 — Global Network & AI (6 weeks)
- Full narrator network graph (D3 force-directed, 10k+ nodes)
- Shortest path between narrators
- AI-powered topic search
- Quran ↔ Hadith cross-reference bridge
- Quranlytics integration (shared auth, linked references)

### Phase 5 — Ulumul Hadith Tools & Community (4 weeks)
- Rijal encyclopedia (full narrator database browser)
- 'Illah notes display
- Tabaqah (generation) timeline
- Shareable hadith card generator
- Personal collections + public sharing

---

## 10. Non-Goals (for now)

- No fatwa generation or religious rulings via AI
- No live debate/comment system
- No hadith grading by the platform — display only what classical scholars said
- No mobile native app (PWA sufficient for Phase 1-3)
- No Shia hadith corpus (scope: Sunni Kutub al-Sittah only initially)

---

## 11. Relationship to Quranlytics

Sanad is designed as a **companion platform**, not a standalone silo:

| Shared | Distinct |
|---|---|
| Auth system (one account) | Separate domain/subdomain |
| Design tokens (colors, fonts) | Different signature elements |
| Arabic text rendering patterns | Graph visualization layer |
| Django monorepo (separate app) | Narrator/isnad data models |
| Redis + Celery infra | NetworkX graph engine |

Deployment options:
- `quranlytics.id` + `sanad.quranlytics.id`
- Or unified: `quranlytics.id/quran` + `quranlytics.id/hadith`

---

## 12. Success Metrics

| Metric | Target (6 months) |
|---|---|
| Monthly Active Users | 8,000+ |
| Isnad graph views per session | > 3 |
| Narrator profiles viewed | > 50,000/month |
| Search queries (matn + narrator) | > 100,000/month |
| Average session duration | > 10 minutes |

---

## 13. Open Questions

1. **Narrator data quality**: fawazahmed0 doesn't include structured narrator metadata — how much manual curation is needed? Consider sourcing from `islamweb.net` rijal data or `dorar.net`.
2. **Musnad Ahmad**: 27,000+ hadiths — include in Phase 1 or defer to Phase 2?
3. **Graph performance**: 10k+ narrator nodes — does React Flow handle this or do we need a WebGL renderer (Sigma.js)?
4. **Grading disagreements**: Same hadith graded differently by Al-Albani vs Ibn Hajar — how to display multiple gradings cleanly?
5. **Indonesian translations**: gadingnst API covers 9 books but may have gaps — verify coverage before ingestion.
