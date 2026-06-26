"""Precomputed analytics tables.

These are populated by Celery (queue: 'analytics'). The API NEVER runs COUNT or
similarity queries against raw corpus tables at request time — it reads from here.
"""
from django.db import models


class WordFrequencyHadith(models.Model):
    """Word/lemma frequency across the corpus, with per-book distribution."""

    lemma = models.CharField(max_length=200, db_index=True)  # cleaned Arabic token
    total_count = models.IntegerField(default=0)
    per_book_distribution = models.JSONField(default=dict)  # {book_slug: count}

    class Meta:
        ordering = ["-total_count"]

    def __str__(self):
        return f"{self.lemma} ({self.total_count})"


class NarratorStats(models.Model):
    """Materialized narrator stats, recomputed nightly."""

    narrator = models.OneToOneField(
        "isnad.Narrator", on_delete=models.CASCADE, related_name="stats"
    )
    total_hadiths = models.IntegerField(default=0)
    books_appeared_in = models.JSONField(default=list)
    teacher_count = models.IntegerField(default=0)
    student_count = models.IntegerField(default=0)
    centrality_score = models.FloatField(default=0.0)

    class Meta:
        ordering = ["-centrality_score"]

    def __str__(self):
        return f"stats for narrator {self.narrator_id}"


class BookGradeStats(models.Model):
    """Grade distribution per book, precomputed for the Grading Explorer."""

    book = models.OneToOneField(
        "hadith.Book", on_delete=models.CASCADE, related_name="grade_stats"
    )
    sahih = models.IntegerField(default=0)
    hasan = models.IntegerField(default=0)
    daif = models.IntegerField(default=0)
    maudu = models.IntegerField(default=0)
    unknown = models.IntegerField(default=0)

    def __str__(self):
        return f"grade stats for {self.book_id}"
