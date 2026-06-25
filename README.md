# Sanad (سند) — Hadith Intelligence Platform

> *"Every hadith has a chain. Now you can see it."*

Sanad is a Hadith reader + analytical intelligence platform. Read the Hadith corpus
(Kutub al-Sittah and more) in Arabic, English, and Indonesian — then go deeper with
isnad (narrator chain) visualization, narrator reliability analysis, matn (text)
pattern analysis, and cross-reference tools.

Companion to **Quranlytics** (shared auth + design system).

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Django 5 + Django REST Framework |
| Database | PostgreSQL 16 (pg_trgm, full-text search) |
| Graph | NetworkX (server), React Flow + D3.js (client) |
| Cache / Queue | Redis + Celery |
| Infra | Docker Compose, GCP Cloud Run |

---

## Quick start (development)

```bash
cp .env.example .env          # fill in secrets

# With Docker
docker compose up --build

# Or run pieces locally
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py runserver

cd frontend && npm install && npm run dev
```

Backend: http://localhost:8000  ·  Frontend: http://localhost:3000

---

## Data ingestion

Run in this exact order (see `CLAUDE.md` for details):

```bash
python manage.py ingest_corpus --source=fawazahmed0
python manage.py ingest_translations_id
python manage.py ingest_narrators --source=sunnah
python manage.py build_narrator_graph
python manage.py compute_stats
```

---

## Project layout

```
backend/    Django 5 + DRF API (apps: hadith, isnad, analytics, semantic, users)
frontend/   Next.js 14 reader + analytics UI
```

See [CLAUDE.md](./CLAUDE.md) and [PRD.md](./PRD.md) for the full specification.

## Build phases

- **Phase 1 — Reader Foundation** (current): corpus ingestion, reader, search, inline sanad, bookmarks
- Phase 2 — Isnad visualizer (React Flow graphs)
- Phase 3 — Analytics engine
- Phase 4 — Global network & AI
- Phase 5 — Ulumul Hadith tools

## License & adab

All Arabic Hadith text is rendered exactly as sourced — never altered, paraphrased,
or truncated. Narrator reliability grades are always attributed to classical scholars;
the platform never asserts its own grading.
