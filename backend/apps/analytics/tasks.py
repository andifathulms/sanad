"""Celery tasks for nightly stats recomputation (queue: 'analytics')."""
import re
from collections import Counter, defaultdict

from celery import shared_task
from django.db.models import Count

from apps.analytics.models import BookGradeStats, NarratorStats, WordFrequencyHadith
from apps.hadith.models import Book, Hadith
from apps.isnad.models import HadithNarrator, Narrator

_TOKEN_RE = re.compile(r"[ء-ي]+")  # Arabic letters only


@shared_task(name="apps.analytics.tasks.compute_stats")
def compute_stats():
    """Recompute grade distribution per book, narrator stats and word frequency."""
    _compute_grade_stats()
    _compute_narrator_stats()
    _compute_word_frequency()
    return {"status": "ok"}


def _compute_grade_stats():
    for book in Book.objects.all():
        counts = dict(
            Hadith.objects.filter(book=book)
            .values_list("grade")
            .annotate(n=Count("id"))
            .values_list("grade", "n")
        )
        BookGradeStats.objects.update_or_create(
            book=book,
            defaults={
                "sahih": counts.get("sahih", 0),
                "hasan": counts.get("hasan", 0),
                "daif": counts.get("daif", 0),
                "maudu": counts.get("maudu", 0),
                "unknown": counts.get("unknown", 0),
            },
        )


def _compute_narrator_stats():
    for narrator in Narrator.objects.all().only("id", "centrality_score"):
        appearances = HadithNarrator.objects.filter(narrator=narrator)
        books = sorted(
            set(appearances.values_list("hadith__book__slug", flat=True))
        )
        NarratorStats.objects.update_or_create(
            narrator=narrator,
            defaults={
                "total_hadiths": appearances.values("hadith").distinct().count(),
                "books_appeared_in": books,
                "teacher_count": narrator.teachers.count(),
                "student_count": narrator.students.count(),
                "centrality_score": narrator.centrality_score,
            },
        )


def _compute_word_frequency():
    per_book = defaultdict(Counter)
    for h_id, slug, matn in Hadith.objects.values_list("id", "book__slug", "matn_clean"):
        for token in _TOKEN_RE.findall(matn or ""):
            per_book[token][slug] += 1

    WordFrequencyHadith.objects.all().delete()
    rows = []
    for lemma, book_counts in per_book.items():
        rows.append(
            WordFrequencyHadith(
                lemma=lemma,
                total_count=sum(book_counts.values()),
                per_book_distribution=dict(book_counts),
            )
        )
    WordFrequencyHadith.objects.bulk_create(rows, batch_size=1000)


@shared_task(name="apps.analytics.tasks.compute_similarity")
def compute_similarity(threshold: float = 0.7):
    """Placeholder for the matn-similarity batch (Phase 3).

    Real implementation will compare normalized matn via pg_trgm similarity and
    populate HadithParallel. Kept as a task stub so the queue routing is wired now.
    """
    return {"status": "not_implemented", "threshold": threshold}
