# CLAUDE.md — Sanad: Hadith Intelligence Platform

## Project Identity

**Sanad** is a Hadith reader + analytical intelligence platform. Users can read the Hadith corpus (Kutub al-Sittah and more) in Arabic, English, and Indonesian — then go deeper with isnad (narrator chain) visualization, narrator reliability analysis, matn (text) pattern analysis, and cross-reference tools.

This is a spiritually significant project. All Arabic Hadith text must be rendered exactly as sourced — never altered, paraphrased, or truncated. Narrator reliability grades must be attributed to classical scholars, never asserted by the platform itself.

**Companion project:** Quranlytics (same owner, shared auth + design system).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Django 5 + Django REST Framework |
| Database | PostgreSQL 16 (pg_trgm, full-text search) |
| Graph Analysis | NetworkX (Python, server-side) |
| Graph Rendering | React Flow (per-hadith isnad), D3.js (global network) |
| Cache | Redis |
| Task Queue | Celery + Redis |
| Containerization | Docker + Docker Compose |
| Deployment | GCP Cloud Run |

---

## Project Structure

```
sanad/
├── backend/
│   ├── manage.py
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   └── celery.py
│   ├── apps/
│   │   ├── hadith/       # Books, chapters, hadiths, translations
│   │   ├── isnad/        # Narrators, chains, graph edges
│   │   ├── analytics/    # Word frequency, similarity, grades
│   │   ├── semantic/     # AI topic search, embeddings
│   │   └── users/        # Auth, bookmarks, collections, history
│   ├── scripts/
│   │   └── ingest/
│   │       ├── ingest_corpus.py      # fawazahmed0 SQLite → PostgreSQL
│   │       ├── ingest_translations.py # gadingnst API → Indonesian
│   │       ├── ingest_narrators.py    # sunnah.com API narrator data
│   │       └── compute_stats.py       # Materialized views + centrality
│   └── requirements/
│       ├── base.txt
│       ├── dev.txt
│       └── prod.txt
├── frontend/
│   ├── app/
│   │   ├── reader/
│   │   │   └── [book]/
│   │   │       ├── page.tsx          # Chapter list
│   │   │       └── [hadith]/
│   │   │           └── page.tsx      # Hadith detail + sanad
│   │   ├── isnad/
│   │   │   └── [hadith_id]/
│   │   │       └── page.tsx          # Full-screen isnad graph
│   │   ├── narrator/
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Narrator profile
│   │   ├── analyze/
│   │   │   ├── word/
│   │   │   ├── similarity/
│   │   │   └── network/              # Global narrator network
│   │   ├── explore/                  # Topic browser
│   │   ├── tools/                    # Ulumul Hadith tools
│   │   └── dashboard/
│   ├── components/
│   │   ├── reader/
│   │   │   ├── HadithCard.tsx
│   │   │   ├── SanadInline.tsx       # Compact chain in reader
│   │   │   ├── GradeBadge.tsx
│   │   │   └── NarratorChip.tsx      # Clickable narrator in chain
│   │   ├── isnad/
│   │   │   ├── IsnadGraph.tsx        # React Flow wrapper
│   │   │   ├── NarratorNode.tsx      # Custom React Flow node
│   │   │   └── GlobalNetwork.tsx     # D3 force-directed graph
│   │   ├── analytics/
│   │   └── ui/
│   └── lib/
│       ├── api/
│       ├── hooks/
│       └── graph/                    # Graph layout helpers
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## Core Models

### `apps/hadith/models.py`

```python
class Book(models.Model):
    COLLECTION_TYPES = [
        ('sahih', 'Sahih'),
        ('sunan', 'Sunan'),
        ('musnad', 'Musnad'),
        ('muwatta', 'Muwatta'),
        ('jami', "Jami'"),
        ('other', 'Other'),
    ]
    slug = models.SlugField(unique=True)          # e.g. 'bukhari', 'muslim'
    name_arabic = models.CharField(max_length=200)
    name_en = models.CharField(max_length=200)
    name_id = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    author_arabic = models.CharField(max_length=200)
    author_death_ah = models.IntegerField(null=True)
    collection_type = models.CharField(max_length=20, choices=COLLECTION_TYPES)
    total_hadiths = models.IntegerField()
    source_api = models.CharField(max_length=100)  # which API sourced this

class Chapter(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='chapters')
    number = models.IntegerField()
    title_arabic = models.CharField(max_length=500)
    title_en = models.CharField(max_length=500)
    title_id = models.CharField(max_length=500, blank=True)
    hadith_count = models.IntegerField(default=0)

    class Meta:
        unique_together = ('book', 'number')
        ordering = ['book', 'number']

class Hadith(models.Model):
    GRADE_CHOICES = [
        ('sahih', 'Sahih'),
        ('hasan', 'Hasan'),
        ('daif', "Da'if"),
        ('maudu', "Maudu'"),
        ('unknown', 'Unknown'),
    ]
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='hadiths')
    chapter = models.ForeignKey(Chapter, on_delete=models.SET_NULL, null=True, related_name='hadiths')
    number_in_book = models.IntegerField()
    global_reference = models.CharField(max_length=100, unique=True)  # e.g. 'bukhari:1'

    matn_arabic = models.TextField()          # Full Arabic text with tashkeel
    matn_clean = models.TextField()           # Arabic without tashkeel (for search)
    translation_en = models.TextField()
    translation_id = models.TextField(blank=True)

    grade = models.CharField(max_length=20, choices=GRADE_CHOICES, default='unknown')
    grade_source = models.CharField(max_length=200, blank=True)  # e.g. 'Imam Bukhari'
    grade_notes = models.TextField(blank=True)

    has_parallel = models.BooleanField(default=False)
    source_api = models.CharField(max_length=100)

    class Meta:
        unique_together = ('book', 'number_in_book')
        ordering = ['book', 'number_in_book']

class HadithParallel(models.Model):
    """Parallel narrations of the same hadith across books."""
    hadith = models.ForeignKey(Hadith, on_delete=models.CASCADE, related_name='parallels')
    parallel_hadith = models.ForeignKey(Hadith, on_delete=models.CASCADE, related_name='parallel_of')
    similarity_score = models.FloatField()   # 0.0-1.0

    class Meta:
        unique_together = ('hadith', 'parallel_hadith')

class HadithQuranRef(models.Model):
    """Links a hadith to a Quran verse (for Quranlytics bridge)."""
    RELEVANCE_TYPES = [('explains', 'Explains'), ('context', 'Context'), ('mentions', 'Mentions')]
    hadith = models.ForeignKey(Hadith, on_delete=models.CASCADE, related_name='quran_refs')
    surah_number = models.IntegerField()
    verse_number = models.IntegerField()
    relevance_type = models.CharField(max_length=20, choices=RELEVANCE_TYPES)
```

### `apps/isnad/models.py`

```python
class Narrator(models.Model):
    GENERATION_CHOICES = [
        ('sahabi', 'Sahabi (Companion)'),
        ('tabii', "Tabi'i (Successor)"),
        ('taba_tabii', "Tabi' al-Tabi'in"),
        ('later', 'Later Generation'),
        ('collector', 'Hadith Collector'),
        ('unknown', 'Unknown'),
    ]
    RELIABILITY_CHOICES = [
        ('thiqah', 'Thiqah (Reliable)'),
        ('saduq', "Saduq (Truthful)"),
        ('daif', "Da'if (Weak)"),
        ('majhul', 'Majhul (Unknown)'),
        ('matruk', "Matruk (Abandoned)"),
        ('unknown', 'Unknown'),
    ]
    name_arabic = models.CharField(max_length=300)
    name_transliteration = models.CharField(max_length=300)
    name_en = models.CharField(max_length=300)
    kunya = models.CharField(max_length=200, blank=True)       # e.g. Abu Hurayra
    laqab = models.CharField(max_length=200, blank=True)       # nickname
    nasab = models.CharField(max_length=300, blank=True)       # lineage

    birth_year_ah = models.IntegerField(null=True, blank=True)
    death_year_ah = models.IntegerField(null=True, blank=True)
    birth_year_ce = models.IntegerField(null=True, blank=True)
    death_year_ce = models.IntegerField(null=True, blank=True)

    generation = models.CharField(max_length=20, choices=GENERATION_CHOICES)
    region = models.CharField(max_length=100, blank=True)      # Madina, Basra, etc.

    reliability_grade = models.CharField(max_length=20, choices=RELIABILITY_CHOICES)
    reliability_notes = models.TextField(blank=True)
    bio_source = models.CharField(max_length=200, blank=True)  # Tahdhib al-Kamal, etc.

    # Precomputed stats (updated by Celery)
    total_hadiths = models.IntegerField(default=0)
    centrality_score = models.FloatField(default=0.0)

class NarratorLink(models.Model):
    """Directed edge: student narrated FROM teacher."""
    teacher = models.ForeignKey(Narrator, on_delete=models.CASCADE, related_name='students')
    student = models.ForeignKey(Narrator, on_delete=models.CASCADE, related_name='teachers')
    hadith_count = models.IntegerField(default=1)
    book_ids = models.JSONField(default=list)  # which books contain this edge

    class Meta:
        unique_together = ('teacher', 'student')

class Sanad(models.Model):
    """The full narrator chain for a specific hadith."""
    hadith = models.OneToOneField(Hadith, on_delete=models.CASCADE, related_name='sanad')
    chain_text_arabic = models.TextField()
    chain_text_en = models.TextField(blank=True)
    chain_order = models.JSONField()  # ordered list of narrator_ids

class HadithNarrator(models.Model):
    """Many-to-many: hadith ↔ narrator with position in chain."""
    hadith = models.ForeignKey(Hadith, on_delete=models.CASCADE)
    narrator = models.ForeignKey(Narrator, on_delete=models.CASCADE)
    position = models.IntegerField()  # 1 = closest to Prophet ﷺ

    class Meta:
        unique_together = ('hadith', 'narrator', 'position')
        ordering = ['hadith', 'position']
```

---

## Data Ingestion

Run in this exact order:

```bash
# 1. Download fawazahmed0 SQLite dump and convert to PostgreSQL
python manage.py ingest_corpus --source=fawazahmed0

# 2. Ingest Indonesian translations from gadingnst API
python manage.py ingest_translations_id

# 3. Ingest narrator data from sunnah.com API (requires API key)
python manage.py ingest_narrators --source=sunnah

# 4. Build narrator link graph from sanad data
python manage.py build_narrator_graph

# 5. Compute materialized stats (hadith counts, centrality scores)
python manage.py compute_stats

# 6. Build word frequency cache
python manage.py build_frequency_cache

# 7. Compute hadith similarity (matn comparison, batch)
python manage.py compute_similarity --threshold=0.7
```

### API Sources Configuration

```python
# settings/base.py

HADITH_SOURCES = {
    'fawazahmed0': {
        'sqlite_url': 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/',
        'books': ['bukhari', 'muslim', 'abudawud', 'tirmidhi', 'nasai', 'ibnmajah', 'malik', 'riyadussalihin'],
    },
    'gadingnst': {
        'base_url': 'https://api.hadith.gading.dev',
        'books': ['abu-dawud', 'bukhari', 'tirmidzi', 'ibnu-majah', 'muslim', 'nasai'],
    },
    'sunnah_com': {
        'base_url': 'https://api.sunnah.com/v1',
        'api_key': env('SUNNAH_COM_API_KEY'),
    },
}

# Rate limiting for ingestion
INGEST_RATE_LIMIT_PER_SECOND = 1
INGEST_RETRY_ON_429 = True
INGEST_MAX_RETRIES = 3
```

---

## Graph Engine

### Server-side: NetworkX (`apps/isnad/graph.py`)

```python
import networkx as nx

def build_narrator_graph() -> nx.DiGraph:
    """
    Build directed graph: edge = (teacher → student).
    Called by Celery task, result cached in Redis.
    """

def get_shortest_path(narrator1_id: int, narrator2_id: int) -> list[int]:
    """Shortest narrator path between two narrators."""

def get_narrator_subgraph(narrator_id: int, depth: int = 2) -> dict:
    """
    Return ego graph (narrator + N-hop neighbors).
    Returns: { nodes: [...], edges: [...] } for React Flow.
    """

def compute_centrality() -> dict[int, float]:
    """
    Betweenness centrality for all narrators.
    Stored back to Narrator.centrality_score.
    Heavy computation — run in Celery, not request-time.
    """

def get_hadith_chain_graph(hadith_id: int) -> dict:
    """
    Returns the specific sanad chain as a React Flow-compatible
    node/edge structure, with reliability color per node.
    """
```

### Frontend: React Flow (`components/isnad/IsnadGraph.tsx`)

```tsx
// IsnadGraph renders the sanad for a single hadith
// Nodes flow top-to-bottom: Prophet ﷺ at top, collector at bottom
// Node colors from GRADE_COLORS constant
// Clicking a node opens NarratorProfileDrawer (not a new page — keeps context)

const RELIABILITY_COLORS = {
  thiqah:  '#27AE60',  // Emerald
  saduq:   '#F39C12',  // Amber
  daif:    '#E74C3C',  // Crimson
  majhul:  '#7F8C8D',  // Slate
  matruk:  '#8E44AD',  // Purple
  unknown: '#95A5A6',  // Light grey
};
```

---

## Analytics Services

### `apps/analytics/services.py`

```python
def get_word_frequency_hadith(word: str, book_slug: str = None) -> dict:
    """
    Word frequency across hadith corpus.
    If book_slug given, scope to that book only.
    ALWAYS reads from word_frequency_hadith materialized view.
    Returns: { total, per_book: [...], sample_hadiths: [...] }
    """

def find_similar_hadiths(hadith_id: int, threshold: float = 0.7) -> list:
    """
    Find hadiths with similar matn text.
    Uses precomputed hadith_parallel table — NEVER compute on the fly.
    Returns list of { hadith_id, book, similarity_score }
    """

def get_grade_distribution(book_slug: str = None) -> dict:
    """
    Grade breakdown: how many Sahih/Hasan/Da'if in a book (or whole corpus).
    """

def get_narrator_centrality(top_n: int = 20) -> list:
    """Returns top N narrators by betweenness centrality."""

def find_mutabi_shahid(hadith_id: int) -> dict:
    """
    Find supporting narrations:
    - mutabi': same companion, different chain above them
    - shahid: different companion entirely
    Uses HadithParallel table.
    """
```

### Performance Rules (same as Quranlytics, applied to Hadith)
- NEVER run COUNT or similarity queries on raw tables at request time
- ALWAYS use precomputed materialized views / Celery-computed fields
- Cache all analytics responses in Redis (TTL: 24h — corpus is static)
- Graph computations (centrality, shortest path) run in Celery workers only
- Paginate hadith lists: max 20 per page (hadiths are longer than verses)

---

## Frontend Conventions

### Hadith Display Rules

```tsx
// ALWAYS show grade badge — never display a hadith without grading context
<GradeBadge grade={hadith.grade} source={hadith.grade_source} />

// Arabic matn — same rules as Quranlytics
<ArabicText className="text-xl font-amiri leading-loose" dir="rtl">
  {hadith.matn_arabic}
</ArabicText>

// NEVER truncate matn_arabic
// NEVER alter, clean, or paraphrase Arabic hadith text
// ALWAYS show translation alongside Arabic
```

### Grade Badge Component

```tsx
// GradeBadge.tsx
// Colors must match RELIABILITY_COLORS constant exactly
// Always include tooltip: "Graded by: {grade_source}"
// Never state the grade as the platform's own assessment
```

### Sanad Display (Inline, in Reader)

```tsx
// SanadInline shows the chain as a horizontal scroll of NarratorChip components
// Each chip: name (Arabic) + small colored dot for reliability
// Click → opens NarratorProfileDrawer (right-side panel, not navigation)
// "View full chain" button → navigates to /isnad/[hadith_id] (full-screen graph)
```

### Narrator Profile Drawer

```tsx
// Opens as a slide-over panel (not a page navigation) when clicking narrators
// Contains: name, kunya, generation, region, birth/death, reliability, bio
// Bottom tabs: "Their Hadiths" | "Their Teachers" | "Their Students"
// Each tab is paginated, max 10 items visible, lazy-loaded
```

---

## Grading Display Rules (Critical)

- **NEVER** assert a hadith's grade as fact without citing the scholar who said it
- Always format as: `Grade: Sahih` + tooltip `"According to: Imam Bukhari"`
- When multiple scholars disagree, show primary grade + "Scholars differ" indicator
- `Maudu'` (fabricated) hadiths must display a prominent warning banner
- `Da'if` hadiths display an amber warning: "This narration is considered weak"
- Platform NEVER adds its own grading — only surfaces what classical scholars said

---

## Environment Variables

```env
# Django
SECRET_KEY=
DEBUG=False
DATABASE_URL=postgres://user:pass@localhost:5432/sanad
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=

# Hadith APIs
SUNNAH_COM_API_KEY=       # Request from sunnah.com GitHub

# AI (Phase 4)
OPENAI_API_KEY=           # For semantic embeddings (or self-hosted)

# Quranlytics bridge
QURANLYTICS_API_BASE=     # URL of Quranlytics backend (for cross-ref)
SHARED_AUTH_SECRET=        # JWT secret shared with Quranlytics

# GCP
GCP_PROJECT_ID=
GCP_BUCKET_NAME=
```

---

## Docker Setup

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: sanad
      POSTGRES_USER: sanad
      POSTGRES_PASSWORD: sanad_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  backend:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
    depends_on: [db, redis]
    env_file: .env

  celery:
    build: ./backend
    command: celery -A config worker -l info -Q default,graph,analytics
    depends_on: [redis]

  celery_beat:
    build: ./backend
    command: celery -A config beat -l info
    depends_on: [redis]

  frontend:
    build: ./frontend
    command: npm run dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app

volumes:
  postgres_data:
```

### Celery Queue Design

```python
# Three queues to separate concerns:
# default   — user-triggered tasks (bookmark save, etc.)
# graph     — narrator graph computation (heavy, can be slow)
# analytics — nightly stats recomputation

CELERY_TASK_ROUTES = {
    'isnad.tasks.compute_centrality':     {'queue': 'graph'},
    'isnad.tasks.build_narrator_graph':   {'queue': 'graph'},
    'analytics.tasks.compute_stats':      {'queue': 'analytics'},
    'analytics.tasks.compute_similarity': {'queue': 'analytics'},
}
```

---

## Phase 1 Build Order

Claude Code should implement in this exact order:

1. **Models + Migrations** — all models, indexes, constraints
2. **Ingestion scripts** — fawazahmed0 corpus → PostgreSQL (all 6 books)
3. **Indonesian translation ingestion** — gadingnst API
4. **Core Reader APIs** — `/books/`, `/chapters/`, `/hadiths/`, `/search/`
5. **Reader UI** — book list → chapter list → hadith card with grade badge
6. **Inline sanad display** — text chain with narrator chips (no graph yet)
7. **Narrator model + basic profile page** — name, generation, reliability
8. **Bookmarks + Auth** — JWT auth, bookmark endpoints + UI

---

## Known Quirks & Edge Cases

- **Hadith numbering inconsistency**: fawazahmed0 and sunnah.com may use different hadith numbers for the same hadith — store both references, display both
- **Arabic tashkeel variants**: same word may appear with different diacritics across sources — normalize `matn_clean` with `camel_tools.utils.normalize`
- **Narrator name duplicates**: same narrator may appear with different Arabic spellings — deduplicate by death year + generation + known kunya
- **Bismillah in hadith text**: some collections include it as verse 0 — filter it out from matn analysis
- **Mursal / Munqati' chains**: broken chains (missing narrators) — store as-is, flag with `chain_type` field
- **fawazahmed0 Indonesian gaps**: not all books have Indonesian — fall back gracefully to English with a UI label "Indonesian translation not yet available"
- **Graph size warning**: DO NOT load the full narrator network (10k+ nodes) in React Flow — use D3.js with canvas rendering for the global view; React Flow only for per-hadith chains (< 10 nodes)

---

## What NOT to Build

- No automated grading or reliability assessment by the platform
- No user-submitted narrator grades or reliability edits
- No fatwa or religious ruling generation
- No Shia hadith corpus in Phase 1-4
- No audio recitation (text-only corpus)
- No comment/forum system
- No AI that interprets hadith meaning — only surfaces patterns and let users conclude
