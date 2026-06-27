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

from apps.hadith.models import Book, Chapter, Hadith
from apps.hadith.text_utils import normalize_arabic
from scripts.ingest.http import fetch_json

# fawazahmed0 stores grades as free text per scholar. We surface a single primary
# grade (preferring widely-cited muhaddithun) plus the scholar's name — the platform
# never asserts its own grade. Books in this set are Sahih by their collector's standard.
PRIMARY_GRADERS = ["Al-Albani", "Shuaib Al Arnaut", "Zubair Ali Zai"]
INTRINSICALLY_SAHIH = {"bukhari", "muslim"}


def map_grade(text: str) -> str:
    """Map a free-text grade string to one of our GRADE_CHOICES."""
    t = (text or "").lower()
    if not t:
        return "unknown"
    if "maudu" in t or "fabricat" in t or "موضوع" in t:
        return "maudu"
    # 'hasan sahih' / 'sahih lighairihi' -> treat as sahih; check sahih before hasan
    if "sahih" in t or "صحيح" in t:
        return "sahih"
    if "hasan" in t or "حسن" in t:
        return "hasan"
    if "daif" in t or "weak" in t or "ضعيف" in t or "shadh" in t or "munkar" in t:
        return "daif"
    return "unknown"


def pick_grade(grades: list[dict], book_slug: str, author: str) -> tuple[str, str]:
    """Return (grade, grade_source) from the per-scholar grade list."""
    if not grades:
        if book_slug in INTRINSICALLY_SAHIH:
            return "sahih", author  # Sahih by the collector's own criterion
        return "unknown", ""
    by_name = {g.get("name", ""): g.get("grade", "") for g in grades}
    for grader in PRIMARY_GRADERS:
        if grader in by_name:
            return map_grade(by_name[grader]), grader
    first = grades[0]
    return map_grade(first.get("grade", "")), first.get("name", "")

# Display metadata for the books we ingest (slug -> names/author/type).
BOOK_META = {
    "bukhari": ("صحيح البخاري", "Sahih al-Bukhari", "Shahih Bukhari", "Imam al-Bukhari", "sahih"),
    "muslim": ("صحيح مسلم", "Sahih Muslim", "Shahih Muslim", "Imam Muslim", "sahih"),
    "abudawud": ("سنن أبي داود", "Sunan Abu Dawud", "Sunan Abu Dawud", "Abu Dawud", "sunan"),
    "tirmidhi": ("جامع الترمذي", "Jami al-Tirmidhi", "Jami at-Tirmidzi", "al-Tirmidhi", "jami"),
    "nasai": ("سنن النسائي", "Sunan an-Nasa'i", "Sunan an-Nasa'i", "al-Nasa'i", "sunan"),
    "ibnmajah": ("سنن ابن ماجه", "Sunan Ibn Majah", "Sunan Ibnu Majah", "Ibn Majah", "sunan"),
    "malik": ("موطأ مالك", "Muwatta Malik", "Muwatta Malik", "Imam Malik", "muwatta"),
    "nawawi": ("الأربعون النووية", "An-Nawawi's 40 Hadith", "Hadits Arba'in Nawawi", "Imam an-Nawawi", "other"),
    "qudsi": ("الأربعون القدسية", "40 Hadith Qudsi", "Hadits Qudsi", "Various", "other"),
}

CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1"

# Our clean slug -> fawazahmed0 edition key (where they differ).
# NOTE: fawazahmed0 does NOT carry Riyad as-Salihin (PRD open question #5). Its
# `nawawi` edition is An-Nawawi's Forty Hadith and `qudsi` is the Forty Hadith Qudsi.
EDITION_KEY: dict[str, str] = {}


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

        ekey = EDITION_KEY.get(slug, slug)
        ar = self._edition(slug, "ara-" + ekey)
        en = self._edition(slug, "eng-" + ekey)
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

        chapters = self._sync_chapters(book, ar.get("metadata", {}))

        created = 0
        with transaction.atomic():
            for row in ar_hadiths:
                number = row["hadithnumber"]
                arabic = row.get("text", "")
                en_row = en_by_no.get(number, {})
                section_no = (row.get("reference") or {}).get("book")
                grade, grade_source = pick_grade(row.get("grades", []), slug, author)
                Hadith.objects.update_or_create(
                    book=book,
                    number_in_book=number,
                    defaults={
                        "chapter": chapters.get(section_no),
                        "global_reference": f"{slug}:{number}",
                        "alt_reference": str(row.get("arabicnumber") or ""),
                        "matn_arabic": arabic,
                        "matn_clean": normalize_arabic(arabic),
                        "translation_en": en_row.get("text", ""),
                        "translation_en_source": "fawazahmed0 (hadith-api)" if en_row.get("text") else "",
                        "grade": grade,
                        "grade_source": grade_source,
                        "source_api": "fawazahmed0",
                    },
                )
                created += 1
        book.total_hadiths = book.hadiths.count()
        book.save(update_fields=["total_hadiths"])
        for ch in chapters.values():
            ch.hadith_count = book.hadiths.filter(chapter=ch).count()
        Chapter.objects.bulk_update(chapters.values(), ["hadith_count"])
        self.stdout.write(
            self.style.SUCCESS(f"  stored {created} hadiths across {len(chapters)} chapters")
        )

    def _sync_chapters(self, book: Book, metadata: dict) -> dict[int, Chapter]:
        """Create Chapter rows from edition metadata.sections ({number: title}).

        The fawazahmed0 sections are English-titled; Arabic chapter titles are not
        provided by this source, so title_arabic is left blank for later curation.
        """
        sections = metadata.get("sections", {}) or {}
        chapters: dict[int, Chapter] = {}
        for key, title in sections.items():
            try:
                number = int(key)
            except (TypeError, ValueError):
                continue
            if number == 0 or not title:
                continue  # section 0 is an empty preamble
            chapter, _ = Chapter.objects.update_or_create(
                book=book,
                number=number,
                defaults={"title_en": title, "title_arabic": ""},
            )
            chapters[number] = chapter
        return chapters

    def _edition(self, slug: str, edition: str) -> dict:
        url = f"{CDN}/editions/{edition}.json"
        return fetch_json(url)
