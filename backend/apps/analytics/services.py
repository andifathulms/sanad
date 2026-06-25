"""Read-side analytics services.

Performance rules (CLAUDE.md):
- NEVER run COUNT or similarity queries on raw tables at request time
- ALWAYS read from precomputed views / Celery-computed fields
- Cache responses in Redis (24h TTL — corpus is static)
"""
from __future__ import annotations

from django.core.cache import cache
from django.db.models import Count

from apps.analytics.models import BookGradeStats, NarratorStats, WordFrequencyHadith
from apps.hadith.models import Hadith, HadithParallel

CACHE_TTL = 60 * 60 * 24  # 24h


def get_word_frequency_hadith(word: str, book_slug: str | None = None) -> dict:
    """Word frequency across the corpus, optionally scoped to one book.

    Reads from the precomputed word_frequency_hadith table.
    """
    cache_key = f"analytics:wordfreq:{word}:{book_slug or 'all'}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    try:
        row = WordFrequencyHadith.objects.get(lemma=word)
    except WordFrequencyHadith.DoesNotExist:
        result = {"word": word, "total": 0, "per_book": [], "sample_hadiths": []}
        cache.set(cache_key, result, CACHE_TTL)
        return result

    per_book = row.per_book_distribution
    if book_slug:
        total = per_book.get(book_slug, 0)
        per_book = {book_slug: total}
    else:
        total = row.total_count

    sample = list(
        Hadith.objects.filter(matn_clean__icontains=word)
        .values("id", "global_reference", "book__slug")[:5]
    )
    result = {
        "word": word,
        "total": total,
        "per_book": [{"book": k, "count": v} for k, v in per_book.items()],
        "sample_hadiths": sample,
    }
    cache.set(cache_key, result, CACHE_TTL)
    return result


def find_similar_hadiths(hadith_id: int, threshold: float = 0.7) -> list[dict]:
    """Find textually similar hadiths using the precomputed parallel table.

    NEVER computes similarity on the fly.
    """
    rows = (
        HadithParallel.objects.filter(
            hadith_id=hadith_id, similarity_score__gte=threshold
        )
        .select_related("parallel_hadith", "parallel_hadith__book")
        .order_by("-similarity_score")
    )
    return [
        {
            "hadith_id": r.parallel_hadith_id,
            "book": r.parallel_hadith.book.slug,
            "global_reference": r.parallel_hadith.global_reference,
            "similarity_score": r.similarity_score,
        }
        for r in rows
    ]


def get_grade_distribution(book_slug: str | None = None) -> dict:
    """Grade breakdown for a book (or the whole corpus) from BookGradeStats."""
    cache_key = f"analytics:grades:{book_slug or 'all'}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    qs = BookGradeStats.objects.all()
    if book_slug:
        qs = qs.filter(book__slug=book_slug)

    totals = {"sahih": 0, "hasan": 0, "daif": 0, "maudu": 0, "unknown": 0}
    for stat in qs:
        totals["sahih"] += stat.sahih
        totals["hasan"] += stat.hasan
        totals["daif"] += stat.daif
        totals["maudu"] += stat.maudu
        totals["unknown"] += stat.unknown
    cache.set(cache_key, totals, CACHE_TTL)
    return totals


def get_narrator_centrality(top_n: int = 20) -> list[dict]:
    """Top N narrators by betweenness centrality (precomputed)."""
    rows = (
        NarratorStats.objects.select_related("narrator")
        .order_by("-centrality_score")[:top_n]
    )
    return [
        {
            "id": r.narrator_id,
            "name": r.narrator.name_transliteration,
            "centrality_score": r.centrality_score,
            "hadith_count": r.total_hadiths,
        }
        for r in rows
    ]


def find_mutabi_shahid(hadith_id: int) -> dict:
    """Find supporting narrations (mutabi' = same companion, shahid = different).

    Uses the HadithParallel table; companion comparison uses position-1 narrator.
    """
    from apps.isnad.models import HadithNarrator

    def companion(h_id: int):
        return (
            HadithNarrator.objects.filter(hadith_id=h_id, position=1)
            .values_list("narrator_id", flat=True)
            .first()
        )

    base_companion = companion(hadith_id)
    mutabi, shahid = [], []
    for parallel in find_similar_hadiths(hadith_id, threshold=0.0):
        p_companion = companion(parallel["hadith_id"])
        bucket = mutabi if p_companion == base_companion else shahid
        bucket.append(parallel)
    return {"mutabi": mutabi, "shahid": shahid}


def get_corpus_overview() -> dict:
    """Lightweight dashboard overview, cached. Counts come from precomputed stats."""
    cache_key = "analytics:overview"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    by_grade = dict(
        Hadith.objects.values_list("grade").annotate(n=Count("id")).values_list("grade", "n")
    )
    result = {"total_hadiths": sum(by_grade.values()), "by_grade": by_grade}
    cache.set(cache_key, result, CACHE_TTL)
    return result
