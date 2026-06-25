"""Ingest Indonesian translations from the gadingnst hadith API.

Usage: python manage.py ingest_translations_id [--books bukhari muslim]

Matches gadingnst hadiths to existing rows by (book, number_in_book). Books without
Indonesian coverage are skipped gracefully — the reader falls back to English with a
"Indonesian translation not yet available" label (see CLAUDE.md).
"""
from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.hadith.models import Book, Hadith
from scripts.ingest.http import fetch_json

# Map our internal slugs to gadingnst's slugs.
SLUG_MAP = {
    "bukhari": "bukhari",
    "muslim": "muslim",
    "abudawud": "abu-dawud",
    "tirmidhi": "tirmidzi",
    "nasai": "nasai",
    "ibnmajah": "ibnu-majah",
}


class Command(BaseCommand):
    help = "Ingest Indonesian translations from the gadingnst API."

    def add_arguments(self, parser):
        parser.add_argument("--books", nargs="*")

    def handle(self, *args, **opts):
        base = settings.HADITH_SOURCES["gadingnst"]["base_url"]
        slugs = opts["books"] or list(SLUG_MAP.keys())
        for slug in slugs:
            remote = SLUG_MAP.get(slug)
            if not remote:
                self.stderr.write(self.style.WARNING(f"No Indonesian source for '{slug}'"))
                continue
            try:
                book = Book.objects.get(slug=slug)
            except Book.DoesNotExist:
                self.stderr.write(self.style.WARNING(f"Book '{slug}' not ingested yet, skip"))
                continue
            self._ingest(book, base, remote)

    def _ingest(self, book: Book, base: str, remote: str):
        self.stdout.write(f"→ Indonesian for {book.name_en}")
        # gadingnst returns the full range when given a wide bound.
        url = f"{base}/books/{remote}?range=1-{max(book.total_hadiths, 1)}"
        try:
            data = fetch_json(url)
        except Exception as exc:  # noqa: BLE001 — coverage gaps are expected
            self.stderr.write(self.style.WARNING(f"  unavailable ({exc}); skipping"))
            return

        hadiths = data.get("data", {}).get("hadiths", [])
        updated = 0
        for row in hadiths:
            number = row.get("number")
            text_id = row.get("id") or row.get("translation_id") or ""
            if not number or not text_id:
                continue
            updated += Hadith.objects.filter(book=book, number_in_book=number).update(
                translation_id=text_id
            )
        self.stdout.write(self.style.SUCCESS(f"  updated {updated} translations"))
