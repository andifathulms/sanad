"""Narrator (rijal) and chain-of-transmission (isnad) models."""
from django.contrib.postgres.indexes import GinIndex
from django.db import models

from apps.hadith.models import Hadith


class Narrator(models.Model):
    GENERATION_CHOICES = [
        ("sahabi", "Sahabi (Companion)"),
        ("tabii", "Tabi'i (Successor)"),
        ("taba_tabii", "Tabi' al-Tabi'in"),
        ("later", "Later Generation"),
        ("collector", "Hadith Collector"),
        ("unknown", "Unknown"),
    ]
    RELIABILITY_CHOICES = [
        ("thiqah", "Thiqah (Reliable)"),
        ("saduq", "Saduq (Truthful)"),
        ("daif", "Da'if (Weak)"),
        ("majhul", "Majhul (Unknown)"),
        ("matruk", "Matruk (Abandoned)"),
        ("unknown", "Unknown"),
    ]
    name_arabic = models.CharField(max_length=300)
    name_transliteration = models.CharField(max_length=300)
    name_en = models.CharField(max_length=300)
    kunya = models.CharField(max_length=200, blank=True)  # e.g. Abu Hurayra
    laqab = models.CharField(max_length=200, blank=True)  # nickname
    nasab = models.CharField(max_length=300, blank=True)  # lineage

    birth_year_ah = models.IntegerField(null=True, blank=True)
    death_year_ah = models.IntegerField(null=True, blank=True)
    birth_year_ce = models.IntegerField(null=True, blank=True)
    death_year_ce = models.IntegerField(null=True, blank=True)

    generation = models.CharField(max_length=20, choices=GENERATION_CHOICES, default="unknown")
    region = models.CharField(max_length=100, blank=True)  # Madina, Basra, etc.

    reliability_grade = models.CharField(
        max_length=20, choices=RELIABILITY_CHOICES, default="unknown"
    )
    reliability_notes = models.TextField(blank=True)
    bio_source = models.CharField(max_length=200, blank=True)  # Tahdhib al-Kamal, etc.

    # Precomputed stats (updated by Celery — never at request time)
    total_hadiths = models.IntegerField(default=0)
    centrality_score = models.FloatField(default=0.0)

    class Meta:
        ordering = ["name_transliteration"]
        indexes = [
            models.Index(fields=["generation"]),
            models.Index(fields=["reliability_grade"]),
            models.Index(fields=["-centrality_score"]),
            # Trigram index for fuzzy Arabic name search
            GinIndex(
                name="narrator_name_ar_trgm",
                fields=["name_arabic"],
                opclasses=["gin_trgm_ops"],
            ),
        ]

    def __str__(self):
        return self.name_transliteration or self.name_en


class NarratorLink(models.Model):
    """Directed edge: student narrated FROM teacher."""

    teacher = models.ForeignKey(Narrator, on_delete=models.CASCADE, related_name="students")
    student = models.ForeignKey(Narrator, on_delete=models.CASCADE, related_name="teachers")
    hadith_count = models.IntegerField(default=1)
    book_ids = models.JSONField(default=list)  # which books contain this edge

    class Meta:
        unique_together = ("teacher", "student")
        indexes = [
            models.Index(fields=["teacher"]),
            models.Index(fields=["student"]),
        ]

    def __str__(self):
        return f"{self.teacher_id} -> {self.student_id}"


class Sanad(models.Model):
    """The full narrator chain for a specific hadith."""

    hadith = models.OneToOneField(Hadith, on_delete=models.CASCADE, related_name="sanad")
    chain_text_arabic = models.TextField()
    chain_text_en = models.TextField(blank=True)
    chain_order = models.JSONField(default=list)  # ordered list of narrator_ids

    def __str__(self):
        return f"sanad for {self.hadith_id}"


class HadithNarrator(models.Model):
    """Many-to-many: hadith <-> narrator with position in chain."""

    hadith = models.ForeignKey(Hadith, on_delete=models.CASCADE, related_name="chain")
    narrator = models.ForeignKey(Narrator, on_delete=models.CASCADE, related_name="appearances")
    position = models.IntegerField()  # 1 = closest to the Prophet (peace be upon him)

    class Meta:
        unique_together = ("hadith", "narrator", "position")
        ordering = ["hadith", "position"]
