"""Rebuild the word frequency table from matn_clean.

Usage: python manage.py build_frequency_cache

Thin wrapper around the analytics word-frequency computation so the ingestion
pipeline step documented in CLAUDE.md maps to a command.
"""
from django.core.management.base import BaseCommand

from apps.analytics.tasks import _compute_word_frequency


class Command(BaseCommand):
    help = "Rebuild the word_frequency_hadith table."

    def handle(self, *args, **opts):
        self.stdout.write("Building word frequency cache…")
        _compute_word_frequency()
        from apps.analytics.models import WordFrequencyHadith

        self.stdout.write(self.style.SUCCESS(f"{WordFrequencyHadith.objects.count()} lemmas"))
