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
        # .order_by() clears Hadith's default ordering — otherwise its ORDER BY columns
        # are added to the SELECT and break DISTINCT (yielding one slug *per hadith*).
        slugs = sorted(qs.order_by().values_list("book__slug", flat=True).distinct())
        for slug in slugs:
            book_qs = qs.filter(book__slug=slug)
            if opts["limit"]:
                book_qs = book_qs[: opts["limit"]]
            h, c, n = self._process_book(slug, book_qs, cache)
            total_hadiths += h
            with_chain += c
            total_links += n

        self._backfill_total_hadiths()
        self.stdout.write(
            self.style.SUCCESS(
                f"Done: {with_chain}/{total_hadiths} hadiths chained, "
                f"{len(cache)} unique narrators, {total_links} chain links"
            )
        )

    @staticmethod
    def _backfill_total_hadiths():
        """Set Narrator.total_hadiths from chain appearances in one aggregate query."""
        from django.db import connection

        with connection.cursor() as cur:
            cur.execute(
                """
                UPDATE isnad_narrator n SET total_hadiths = COALESCE(sub.cnt, 0)
                FROM (
                    SELECT narrator_id, COUNT(DISTINCT hadith_id) AS cnt
                    FROM isnad_hadithnarrator GROUP BY narrator_id
                ) sub
                WHERE sub.narrator_id = n.id
                """
            )

    def _process_book(self, slug, book_qs, cache):
        """Batch a whole book: extract all chains, then bulk-insert in a few queries.

        Order matters — narrators are created first so HadithNarrator FKs resolve.
        """
        processed = 0
        parsed: list[tuple[int, list[str]]] = []  # (hadith_id, ordered names, Prophet-side first)
        new_names: dict[str, str] = {}  # dedup key -> display name, for names not yet seen

        for hid, matn in book_qs.values_list("id", "matn_arabic").iterator(chunk_size=1000):
            processed += 1
            names = extract_chain(matn)
            if len(names) < 2:
                continue
            ordered = list(reversed(names))  # position 1 = Prophet-side
            parsed.append((hid, ordered))
            for name in ordered:
                key = dedup_key(name)
                if key not in cache and key not in new_names:
                    new_names[key] = name

        with transaction.atomic():
            # 1) create the narrators this book introduces. Create individually so the
            #    key→id mapping is exact (bulk_create PK ordering is easy to misalign).
            for key, name in new_names.items():
                cache[key] = Narrator.objects.create(
                    name_arabic=name,
                    name_transliteration=name,
                    name_en=name,
                    generation="unknown",
                    reliability_grade="unknown",
                ).id

            # 2) rebuild chains + sanads for these hadiths
            hadith_ids = [hid for hid, _ in parsed]
            HadithNarrator.objects.filter(hadith_id__in=hadith_ids).delete()
            Sanad.objects.filter(hadith_id__in=hadith_ids).delete()

            chain_rows, sanad_rows = [], []
            links = chained = 0
            for hid, ordered in parsed:
                chain_ids: list[int] = []
                for position, name in enumerate(ordered, start=1):
                    nid = cache[dedup_key(name)]
                    if nid in chain_ids:
                        continue  # a name repeating in one chain
                    chain_ids.append(nid)
                    chain_rows.append(
                        HadithNarrator(hadith_id=hid, narrator_id=nid, position=position)
                    )
                sanad_rows.append(
                    Sanad(
                        hadith_id=hid,
                        chain_text_arabic=" ← ".join(ordered),
                        chain_order=chain_ids,
                    )
                )
                chained += 1
                links += max(len(chain_ids) - 1, 0)

            HadithNarrator.objects.bulk_create(chain_rows, batch_size=2000)
            Sanad.objects.bulk_create(sanad_rows, batch_size=2000)

        self.stdout.write(f"  {slug}: {chained}/{processed} chained")
        return processed, chained, links
