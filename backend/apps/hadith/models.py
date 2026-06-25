"""Core corpus models: books, chapters, hadiths and their relationships."""
from django.contrib.postgres.indexes import GinIndex
from django.db import models


class Book(models.Model):
    COLLECTION_TYPES = [
        ("sahih", "Sahih"),
        ("sunan", "Sunan"),
        ("musnad", "Musnad"),
        ("muwatta", "Muwatta"),
        ("jami", "Jami'"),
        ("other", "Other"),
    ]
    slug = models.SlugField(unique=True)  # e.g. 'bukhari', 'muslim'
    name_arabic = models.CharField(max_length=200)
    name_en = models.CharField(max_length=200)
    name_id = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    author_arabic = models.CharField(max_length=200)
    author_death_ah = models.IntegerField(null=True, blank=True)
    collection_type = models.CharField(max_length=20, choices=COLLECTION_TYPES)
    total_hadiths = models.IntegerField(default=0)
    # Grade breakdown cached as jsonb (see PRD schema)
    grade_summary = models.JSONField(default=dict, blank=True)
    source_api = models.CharField(max_length=100)  # which API sourced this

    class Meta:
        ordering = ["slug"]

    def __str__(self):
        return self.name_en


class Chapter(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="chapters")
    number = models.IntegerField()
    title_arabic = models.CharField(max_length=500)
    title_en = models.CharField(max_length=500)
    title_id = models.CharField(max_length=500, blank=True)
    hadith_count = models.IntegerField(default=0)

    class Meta:
        unique_together = ("book", "number")
        ordering = ["book", "number"]

    def __str__(self):
        return f"{self.book.slug} ch.{self.number}: {self.title_en}"


class Hadith(models.Model):
    GRADE_CHOICES = [
        ("sahih", "Sahih"),
        ("hasan", "Hasan"),
        ("daif", "Da'if"),
        ("maudu", "Maudu'"),
        ("unknown", "Unknown"),
    ]
    # Chains that are not fully connected (see CLAUDE.md known quirks)
    CHAIN_TYPES = [
        ("muttasil", "Muttasil (connected)"),
        ("mursal", "Mursal (missing companion)"),
        ("munqati", "Munqati' (broken)"),
        ("unknown", "Unknown"),
    ]
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="hadiths")
    chapter = models.ForeignKey(
        Chapter, on_delete=models.SET_NULL, null=True, blank=True, related_name="hadiths"
    )
    number_in_book = models.IntegerField()
    global_reference = models.CharField(max_length=100, unique=True)  # e.g. 'bukhari:1'
    # Alternate numbering from a second source (numbering differs across APIs)
    alt_reference = models.CharField(max_length=100, blank=True)

    matn_arabic = models.TextField()  # Full Arabic text with tashkeel
    matn_clean = models.TextField(blank=True)  # Arabic without tashkeel (for search)
    translation_en = models.TextField(blank=True)
    translation_id = models.TextField(blank=True)

    grade = models.CharField(max_length=20, choices=GRADE_CHOICES, default="unknown")
    grade_source = models.CharField(max_length=200, blank=True)  # e.g. 'Imam Bukhari'
    grade_notes = models.TextField(blank=True)

    chain_type = models.CharField(max_length=20, choices=CHAIN_TYPES, default="unknown")
    has_parallel = models.BooleanField(default=False)
    source_api = models.CharField(max_length=100)

    class Meta:
        unique_together = ("book", "number_in_book")
        ordering = ["book", "number_in_book"]
        indexes = [
            models.Index(fields=["grade"]),
            models.Index(fields=["book", "grade"]),
            # GIN index for full-text Arabic search on the clean matn
            GinIndex(
                name="hadith_matn_clean_trgm",
                fields=["matn_clean"],
                opclasses=["gin_trgm_ops"],
            ),
        ]

    def __str__(self):
        return self.global_reference


class HadithParallel(models.Model):
    """Parallel narrations of the same hadith across books."""

    hadith = models.ForeignKey(Hadith, on_delete=models.CASCADE, related_name="parallels")
    parallel_hadith = models.ForeignKey(
        Hadith, on_delete=models.CASCADE, related_name="parallel_of"
    )
    similarity_score = models.FloatField()  # 0.0-1.0

    class Meta:
        unique_together = ("hadith", "parallel_hadith")
        ordering = ["-similarity_score"]


class HadithQuranRef(models.Model):
    """Links a hadith to a Quran verse (for the Quranlytics bridge)."""

    RELEVANCE_TYPES = [
        ("explains", "Explains"),
        ("context", "Context"),
        ("mentions", "Mentions"),
    ]
    hadith = models.ForeignKey(Hadith, on_delete=models.CASCADE, related_name="quran_refs")
    surah_number = models.IntegerField()
    verse_number = models.IntegerField()
    relevance_type = models.CharField(max_length=20, choices=RELEVANCE_TYPES)

    class Meta:
        unique_together = ("hadith", "surah_number", "verse_number")
        ordering = ["surah_number", "verse_number"]
