"""Extract isnad chains from the matn and populate narrators + chains.

Usage:
    python manage.py build_isnad [--books bukhari muslim] [--limit N] [--reset]

For each hadith we parse the chain from matn_arabic, deduplicate narrators by a
normalized name key, and write Narrator / HadithNarrator / Sanad rows. Positions run
1 = closest to the Prophet (peace be upon him) → N = the collector's direct source, so
the downstream graph builder derives teacher→student edges correctly.

Narrators are created with reliability_grade='unknown' and generation='unknown' — this
command recovers chain STRUCTURE only and never asserts a grade.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.hadith.models import Hadith
from apps.isnad.extraction import dedup_key, extract_chain
from apps.isnad.models import HadithNarrator, Narrator, Sanad


class Command(BaseCommand):
    help = "Extract isnad chains from matn and populate narrators + chains."

    def add_arguments(self, parser):
        parser.add_argument("--books", nargs="*", help="Subset of book slugs")
        parser.add_argument("--limit", type=int, default=0, help="Max hadiths per book")
        parser.add_argument("--reset", action="store_true", help="Clear existing isnad data first")

    def handle(self, *args, **opts):
        if opts["reset"]:
            self.stdout.write("Clearing existing narrators and chains…")
            HadithNarrator.objects.all().delete()
            Sanad.objects.all().delete()
            Narrator.objects.all().delete()

        # In-memory cache: dedup key -> narrator id (seed from any existing rows).
        cache: dict[str, int] = {}
        for nid, name in Narrator.objects.values_list("id", "name_arabic"):
            cache[dedup_key(name)] = nid

        qs = Hadith.objects.all()
        if opts["books"]:
            qs = qs.filter(book__slug__in=opts["books"])

        total_hadiths = with_chain = total_links = 0
        for slug in qs.values_list("book__slug", flat=True).distinct():
            book_qs = qs.filter(book__slug=slug)
            if opts["limit"]:
                book_qs = book_qs[: opts["limit"]]
            h, c, n = self._process_book(slug, book_qs, cache)
            total_hadiths += h
            with_chain += c
            total_links += n

        self.stdout.write(
            self.style.SUCCESS(
                f"Done: {with_chain}/{total_hadiths} hadiths chained, "
                f"{len(cache)} unique narrators, {total_links} chain links"
            )
        )

    def _process_book(self, slug, book_qs, cache):
        processed = chained = links = 0
        for hadith in book_qs.only("id", "matn_arabic").iterator(chunk_size=500):
            processed += 1
            names = extract_chain(hadith.matn_arabic)
            if len(names) < 2:
                continue  # nothing usable (e.g. isnad-less muqaddima entries)

            # collector-first → companion-last; reverse so position 1 = Prophet-side
            ordered = list(reversed(names))
            with transaction.atomic():
                HadithNarrator.objects.filter(hadith=hadith).delete()
                chain_ids: list[int] = []
                rows = []
                for position, name in enumerate(ordered, start=1):
                    narrator_id = self._get_or_create_narrator(name, cache)
                    if narrator_id in chain_ids:
                        continue  # guard against a name repeating in one chain
                    chain_ids.append(narrator_id)
                    rows.append(
                        HadithNarrator(hadith=hadith, narrator_id=narrator_id, position=position)
                    )
                HadithNarrator.objects.bulk_create(rows)
                Sanad.objects.update_or_create(
                    hadith=hadith,
                    defaults={
                        "chain_text_arabic": " ← ".join(ordered),
                        "chain_order": chain_ids,
                    },
                )
            chained += 1
            links += max(len(chain_ids) - 1, 0)
        self.stdout.write(f"  {slug}: {chained}/{processed} chained")
        return processed, chained, links

    @staticmethod
    def _get_or_create_narrator(name: str, cache: dict[str, int]) -> int:
        key = dedup_key(name)
        if key in cache:
            return cache[key]
        narrator = Narrator.objects.create(
            name_arabic=name,
            name_transliteration=name,
            name_en=name,
            generation="unknown",
            reliability_grade="unknown",
            bio_source="",
        )
        cache[key] = narrator.id
        return narrator.id
