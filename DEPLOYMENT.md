# Deployment

How Sanad ships: **GitHub Actions builds images on every push to `main` and
pushes them to GHCR. The VM only pulls those images** — no source code, no
builds on the server. You `docker compose pull && up -d`.

```
push to main ──► .github/workflows/release.yml ──► ghcr.io/andifathulms/sanad-backend:latest
                                                └─► ghcr.io/andifathulms/sanad-frontend:latest
                          VM:  docker compose -f docker-compose.prod.yml pull && up -d
```

---

## 1. What the CI publishes

`release.yml` builds two images per push to `main` (and per `v*` tag):

| Image | Built from | Runs |
|---|---|---|
| `…/sanad-backend`  | `backend/Dockerfile` (`REQUIREMENTS=prod`, static baked in) | Django (gunicorn), Celery worker, Celery beat — same image, different command |
| `…/sanad-frontend` | `frontend/Dockerfile.prod` (Next standalone) | the Next.js server |

Tags pushed: `latest` (main), `sha-<commit>` (every build), and `vX.Y.Z` on tags.
**Pin to `sha-…` in production** for clean rollbacks; `latest` is convenient but moving.

No secrets to configure for CI — it uses the built-in `GITHUB_TOKEN` with
`packages: write`. After the first successful run, make the two GHCR packages
private/internal as you prefer (Repo → Packages → settings).

---

## 2. One-time VM setup

```bash
# 1. Install Docker Engine + compose plugin (Ubuntu shown)
curl -fsSL https://get.docker.com | sh

# 2. Log in to GHCR so the VM can pull the images.
#    Use a Personal Access Token (classic) with read:packages scope.
echo "$GHCR_PAT" | docker login ghcr.io -u andifathulms --password-stdin

# 3. Create the deploy directory and drop in the two files the VM needs:
mkdir -p /opt/sanad && cd /opt/sanad
#   - docker-compose.prod.yml   (copy from this repo)
#   - .env                      (copy from .env.prod.example and fill in)
cp .env.prod.example .env   # then edit: SECRET_KEY, POSTGRES_PASSWORD, ALLOWED_HOSTS, image tags…
```

> Only `docker-compose.prod.yml` and `.env` live on the VM. Everything else
> (code, migrations, management commands) is inside the backend image.

---

## 3. First deploy

```bash
cd /opt/sanad
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d db redis
```

Now get data + schema into Postgres. **Pick ONE of the two options below.**

### Option A — Restore a dump from your already-built local DB  ✅ recommended

You already ran the full ingestion **and** the cleanup/normalization locally
(corpus, narrators, transliteration, prune, anonymous-collapse, similarity,
centrality). Don't redo all that on the VM — just move the database.

```bash
# On your machine (dev stack running):
docker exec hadith-analytics-db-1 pg_dump -U sanad -Fc sanad > sanad.dump
scp sanad.dump user@vm:/opt/sanad/

# On the VM:
docker compose -f docker-compose.prod.yml exec -T db \
  pg_restore -U sanad -d sanad --clean --if-exists < sanad.dump
docker compose -f docker-compose.prod.yml run --rm backend python manage.py migrate
```

The dump already contains the cleaned narrators, `HadithGrading`, Quran refs,
topics, stats and centrality — so there is **nothing else to compute**. This is
faster, avoids hitting the external ingestion APIs from the VM, and keeps the
exact data you curated.

### Option B — Run the full pipeline on the VM

Only if you can't move a dump. Runs every step via the backend image. This is
heavy (see VM specs) and needs network egress to the source APIs.

```bash
cd /opt/sanad
run() { docker compose -f docker-compose.prod.yml run --rm backend python manage.py "$@"; }

run migrate
run ingest_corpus --source=fawazahmed0     # ~62k hadiths
run ingest_translations_id                 # Indonesian
run ingest_narrators --source=sunnah       # needs SUNNAH_COM_API_KEY (optional)
run build_isnad                            # extract chains → narrators
run seed_narrator_grades                   # curated reliability grades
run backfill_transliteration               # Arabic → Latin names
run prune_narrators --apply                # merge/clean noisy extracted names
run collapse_anonymous --apply             # fold mubham (unnamed) narrators → sentinel
run seed_quran_refs                        # Quran↔Hadith bridge (curated seed)
run seed_topics                            # /explore topic tags
run compute_stats                          # grade stats, narrator stats, word frequency
run compute_similarity --threshold=0.7     # parallel narrations (pg_trgm) — heaviest step
run build_narrator_graph                   # cache the global graph
# betweenness centrality (no management command — call the task):
docker compose -f docker-compose.prod.yml run --rm backend \
  python manage.py shell -c "from apps.isnad.tasks import compute_centrality; print(compute_centrality())"
```

> The order matters: cleanup (`prune_narrators`, `collapse_anonymous`) must run
> **before** `compute_stats` / `build_narrator_graph` / centrality, so the stats
> reflect the cleaned graph.

### Finish the first deploy (both options)

```bash
docker compose -f docker-compose.prod.yml run --rm backend python manage.py createsuperuser
docker compose -f docker-compose.prod.yml up -d        # start backend, celery, beat, frontend
docker compose -f docker-compose.prod.yml ps
```

The app is now on `:3000` (the frontend). Put a reverse proxy in front for TLS
(see §6). `celery_beat` runs the nightly recompute jobs from here on.

---

## 4. Upgrades (every push to main thereafter)

Data lives in the `postgres_data` volume and survives image swaps. A deploy is:

```bash
cd /opt/sanad
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml run --rm backend python manage.py migrate
docker compose -f docker-compose.prod.yml up -d
docker image prune -f
```

If you pin image tags, bump `BACKEND_IMAGE` / `FRONTEND_IMAGE` in `.env` to the
new `sha-…` first. Rollback = set them back to the previous sha and repeat.

You can automate this with a webhook/watchtower later, but the manual three
lines are the whole story.

### 4.1 Per-release data actions (beyond `migrate`)

`migrate` is always required and idempotent — run it every upgrade. A few
features also need a **one-off data/seed command** that is *not* a schema
migration. Each is one-time per environment; skip any that are already baked
into a dump you restored (Option A). Keep this table updated as features land.

| Shipped feature | Migration? (`migrate` covers it) | Extra one-off command on the VM |
|---|---|---|
| Scholarly gradings (`HadithGrading`) | ✅ `hadith.0002` | — |
| Translation provenance (`translation_*_source`) | ✅ `hadith.0003` — **backfills existing rows** | — |
| `/explore` topics (20 subjects, real counts) | — | `run seed_topics --per-topic 0` |
| Rijal extraction cleanup (fewer matn-fragment narrators) | — | `prune_narrators --apply` → `build_narrator_graph` → `compute_stats` |
| Empty-hadith filtering, clickable cards, reader/network UI | — (code only) | — |

```bash
# If your prod DB predates these, on the VM:
run() { docker compose -f docker-compose.prod.yml run --rm backend python manage.py "$@"; }
run migrate                      # hadith.0002 (gradings) + hadith.0003 (translation sources)
run seed_topics --per-topic 0    # /explore: 20 topics, uncapped (true counts). Idempotent.

# Narrator name-cleaning improved (extraction.py). Re-clean + rebuild the graph so
# teacher/student lists drop matn-fragment artifacts. Order matters (stats last):
run prune_narrators --apply      # merge/trim/delete noisy extracted names
run build_narrator_graph         # rebuild teacher→student edges + cache global graph
run compute_stats                # refresh narrator totals + centrality
```

> Restored a fresh dump taken from your local DB *after* running these? Then
> they're already in the data — just `migrate` (no-op if up to date) and you're done.
>
> A full `build_isnad --reset` (re-extracting every chain with the improved
> heuristics) would clean residual single-chain mis-orderings too, but it wipes
> narrators and cascades the whole isnad pipeline (grades, transliteration,
> prune, collapse) — only worth it on a fresh bootstrap, not a routine upgrade.

---

## 5. The data-pipeline & "do I rerun normalization?" answer

- **Schema changes** (new models/migrations, e.g. `HadithGrading`): yes — run
  `migrate` on every upgrade. One line, idempotent.
- **Ingestion + normalization + cleanup** (`ingest_*`, `build_isnad`,
  `backfill_transliteration`, `prune_narrators`, `collapse_anonymous`, …): these
  are **one-time data bootstrap**, not per-deploy. The results are rows in
  Postgres, which persist in the volume. With **Option A you never run them on
  the VM at all** — they're already baked into the dump.
- **Recompute jobs** (`compute_stats`, `compute_similarity`, centrality,
  `build_narrator_graph`): one-time at bootstrap, then `celery_beat` keeps them
  fresh nightly. Run them manually only after a fresh re-ingestion.

The cleanup commands are all idempotent and dry-run-by-default, so re-running
them is safe if you ever re-ingest.

---

## 6. Reverse proxy / TLS

Only the frontend (`:3000`) needs to be public; it proxies `/api/*` to Django
internally. Terminate TLS at a reverse proxy and keep `SECURE_SSL_REDIRECT=False`
in `.env` (the edge enforces HTTPS; the in-app redirect would 301 the internal
Next→Django call). Minimal Caddy example:

```
sanad.example.com {
    reverse_proxy localhost:3000
}
```

Django `/admin` is only reachable through the localhost-bound backend port
(`127.0.0.1:8000`) — tunnel to it (`ssh -L 8000:localhost:8000 vm`) or add an
authenticated proxy route. Don't expose it publicly without TLS + auth.

---

## 7. Ops cheat-sheet

```bash
docker compose -f docker-compose.prod.yml logs -f backend       # tail logs
docker compose -f docker-compose.prod.yml ps                    # status
# DB backup (cron this):
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U sanad -Fc sanad > backup-$(date +%F).dump
# Force a stats/centrality refresh:
docker compose -f docker-compose.prod.yml run --rm backend python manage.py compute_stats
```

---

## 8. VM specifications

Builds happen in CI, **not** on the VM, so you don't need build-time headroom —
only runtime. The components: Postgres 16 (corpus + pg_trgm GIN indexes),
gunicorn (3 workers), a Celery worker (NetworkX betweenness over ~23k nodes /
~55k edges spikes RAM during recompute), Redis, and the Next standalone server.

| Tier | Specs | Use it when |
|---|---|---|
| **Minimum** | **2 vCPU · 4 GB RAM · 30 GB SSD** | Option A (restore a dump). Steady-state serving for a small/medium audience. Add 2–4 GB swap as a safety net for the nightly Celery centrality spike. |
| **Recommended** | **4 vCPU · 8 GB RAM · 50 GB SSD** | Comfortable headroom: more Postgres cache, concurrent users, and the nightly recompute never pressures RAM. |
| **Bootstrap-on-VM (Option B)** | **4 vCPU · 8–16 GB RAM** temporarily | `compute_similarity` (pg_trgm pairwise over ~62k hadiths) and centrality are CPU/RAM-heavy and slow. Either size up just for the one-time run, or — better — run the pipeline locally and ship a dump (Option A), then drop back to the Minimum tier. |

Sizing notes:
- **Disk**: corpus DB ≈ 1–2 GB, images ≈ 1.5 GB, plus WAL + backups + growth →
  30 GB is fine to start; 50 GB if you keep local dumps.
- **RAM**: steady state ≈ 1.5–2.5 GB. The Celery centrality job is the spike
  (~1 GB transient); the 4 GB tier handles it with swap, the 8 GB tier with ease.
- **CPU**: 2 vCPU serves fine; centrality/similarity are the only CPU-bound jobs
  and they're nightly/one-off, not request-path.
- **Egress**: only needed for Option B (pulling from jsdelivr / gadingnst /
  sunnah.com). Option A needs none beyond pulling images.
- **Managed Postgres** (e.g. Cloud SQL) is a fine alternative — drop the `db`
  service and point `DATABASE_URL` at it; bump the VM down accordingly.
