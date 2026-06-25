"""Ingest the fawazahmed0 hadith corpus (Arabic + English) into PostgreSQL.

Usage:
    python manage.py ingest_corpus --source=fawazahmed0 [--books bukhari muslim] [--limit N]

The fawazahmed0 dataset is published as per-edition JSON on jsDelivr. For each book we
pull the Arabic edition and the English (Sahih International / etc.) edition, then merge
by hadith number. Arabic matn is stored verbatim; matn_clean is the normalized form.
"""
from __future__ import annotations

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.hadith.models import Book, Hadith
from apps.hadith.text_utils import normalize_arabic
from scripts.ingest.http import fetch_json

# Display metadata for the books we ingest (slug -> names/author/type).
BOOK_META = {
    "bukhari": ("صحيح البخاري", "Sahih al-Bukhari", "Shahih Bukhari", "Imam al-Bukhari", "sahih"),
    "muslim": ("صحيح مسلم", "Sahih Muslim", "Shahih Muslim", "Imam Muslim", "sahih"),
    "abudawud": ("سنن أبي داود", "Sunan Abu Dawud", "Sunan Abu Dawud", "Abu Dawud", "sunan"),
    "tirmidhi": ("جامع الترمذي", "Jami al-Tirmidhi", "Jami at-Tirmidzi", "al-Tirmidhi", "jami"),
    "nasai": ("سنن النسائي", "Sunan an-Nasa'i", "Sunan an-Nasa'i", "al-Nasa'i", "sunan"),
    "ibnmajah": ("سنن ابن ماجه", "Sunan Ibn Majah", "Sunan Ibnu Majah", "Ibn Majah", "sunan"),
    "malik": ("موطأ مالك", "Muwatta Malik", "Muwatta Malik", "Imam Malik", "muwatta"),
    "riyadussalihin": ("رياض الصالحين", "Riyad as-Salihin", "Riyadhus Shalihin", "al-Nawawi", "other"),
}

CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1"


class Command(BaseCommand):
    help = "Ingest the fawazahmed0 hadith corpus into PostgreSQL."

    def add_arguments(self, parser):
        parser.add_argument("--source", default="fawazahmed0")
        parser.add_argument("--books", nargs="*", help="Subset of book slugs to ingest")
        parser.add_argument("--limit", type=int, default=0, help="Limit hadiths/book (debug)")

    def handle(self, *args, **opts):
        if opts["source"] != "fawazahmed0":
            raise CommandError("Only --source=fawazahmed0 is supported by this command.")

        books = opts["books"] or settings.HADITH_SOURCES["fawazahmed0"]["books"]
        for slug in books:
            if slug not in BOOK_META:
                self.stderr.write(self.style.WARNING(f"Skipping unknown book '{slug}'"))
                continue
            self._ingest_book(slug, opts["limit"])

    def _ingest_book(self, slug: str, limit: int):
        name_ar, name_en, name_id, author, ctype = BOOK_META[slug]
        self.stdout.write(f"→ {name_en} ({slug})")

        ar = self._edition(slug, "ara-" + slug)
        en = self._edition(slug, "eng-" + slug)
        en_by_no = {h["hadithnumber"]: h for h in en.get("hadiths", [])}
        ar_hadiths = ar.get("hadiths", [])
        if limit:
            ar_hadiths = ar_hadiths[:limit]

        book, _ = Book.objects.update_or_create(
            slug=slug,
            defaults={
                "name_arabic": name_ar,
                "name_en": name_en,
                "name_id": name_id,
                "author": author,
                "author_arabic": name_ar,
                "collection_type": ctype,
                "source_api": "fawazahmed0",
            },
        )

        created = 0
        with transaction.atomic():
            for row in ar_hadiths:
                number = row["hadithnumber"]
                arabic = row.get("text", "")
                english = en_by_no.get(number, {}).get("text", "")
                Hadith.objects.update_or_create(
                    book=book,
                    number_in_book=number,
                    defaults={
                        "global_reference": f"{slug}:{number}",
                        "matn_arabic": arabic,
                        "matn_clean": normalize_arabic(arabic),
                        "translation_en": english,
                        "source_api": "fawazahmed0",
                    },
                )
                created += 1
        book.total_hadiths = book.hadiths.count()
        book.save(update_fields=["total_hadiths"])
        self.stdout.write(self.style.SUCCESS(f"  stored {created} hadiths"))

    def _edition(self, slug: str, edition: str) -> dict:
        url = f"{CDN}/editions/{edition}.json"
        return fetch_json(url)
