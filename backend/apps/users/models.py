"""Auth + personal features (bookmarks, collections, reading history).

The User model is shared in spirit with Quranlytics (one account, shared JWT
signing key). Bookmarks/notes/collections are scoped to the hadith corpus here.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.hadith.models import Hadith


class User(AbstractUser):
    # Locale preference drives which translation is shown first
    LOCALE_CHOICES = [("id", "Indonesian"), ("en", "English"), ("ar", "Arabic")]
    preferred_locale = models.CharField(max_length=2, choices=LOCALE_CHOICES, default="id")
    # Link to the shared Quranlytics account, if any
    quranlytics_user_id = models.CharField(max_length=64, blank=True)

    def __str__(self):
        return self.username


class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="bookmarks")
    hadith = models.ForeignKey(Hadith, on_delete=models.CASCADE, related_name="bookmarks")
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "hadith")
        ordering = ["-created_at"]


class Collection(models.Model):
    """A user-curated list of hadiths (e.g. 'Hadiths on patience')."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="collections")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    hadiths = models.ManyToManyField(Hadith, through="CollectionItem", related_name="collections")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class CollectionItem(models.Model):
    collection = models.ForeignKey(Collection, on_delete=models.CASCADE, related_name="items")
    hadith = models.ForeignKey(Hadith, on_delete=models.CASCADE)
    position = models.IntegerField(default=0)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("collection", "hadith")
        ordering = ["position", "added_at"]


class ReadingHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="history")
    hadith = models.ForeignKey(Hadith, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-read_at"]
        indexes = [models.Index(fields=["user", "-read_at"])]
