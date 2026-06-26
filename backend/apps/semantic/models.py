"""Semantic search models (Phase 4).

Topic browsing works on curated tags now; embedding-based search lands in Phase 4.
"""
from django.db import models

from apps.hadith.models import Hadith


class Topic(models.Model):
    """A browseable subject (Prayer, Fasting, Trade, ...)."""

    slug = models.SlugField(unique=True)
    name_en = models.CharField(max_length=200)
    name_id = models.CharField(max_length=200, blank=True)
    name_arabic = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["name_en"]

    def __str__(self):
        return self.name_en


class HadithTopic(models.Model):
    """Curated link between a hadith and a topic, with a relevance score."""

    hadith = models.ForeignKey(Hadith, on_delete=models.CASCADE, related_name="topics")
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name="hadiths")
    relevance = models.FloatField(default=1.0)

    class Meta:
        unique_together = ("hadith", "topic")
        ordering = ["-relevance"]

    def __str__(self):
        return f"{self.hadith_id} @ {self.topic_id} ({self.relevance:.2f})"
