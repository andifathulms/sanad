"""Compute matn similarity and populate HadithParallel (Phase 3 batch).

Usage: python manage.py compute_similarity --threshold=0.7

Uses PostgreSQL pg_trgm similarity over matn_clean. This is an O(n^2)-ish batch and
must NEVER run at request time — it writes the precomputed HadithParallel rows that
the similarity API reads from.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import connection

from apps.hadith.models import Hadith, HadithParallel


class Command(BaseCommand):
    help = "Populate HadithParallel using pg_trgm similarity over matn_clean."

    def add_arguments(self, parser):
        parser.add_argument("--threshold", type=float, default=0.7)
        parser.add_argument("--book", help="Limit to one book slug")

    def handle(self, *args, **opts):
        threshold = opts["threshold"]
        if connection.vendor != "postgresql":
            self.stderr.write(
                self.style.WARNING("pg_trgm similarity requires PostgreSQL; aborting.")
            )
            return

        qs = Hadith.objects.all()
        if opts["book"]:
            qs = qs.filter(book__slug=opts["book"])

        self.stdout.write(f"Computing similarity (threshold={threshold})…")
        created = 0
        with connection.cursor() as cur:
            cur.execute("SET pg_trgm.similarity_threshold = %s", [threshold])
            for hadith in qs.iterator(chunk_size=500):
                cur.execute(
                    """
                    SELECT id, similarity(matn_clean, %s) AS score
                    FROM hadith_hadith
                    WHERE id <> %s AND matn_clean %% %s
                    ORDER BY score DESC LIMIT 25
                    """,
                    [hadith.matn_clean, hadith.id, hadith.matn_clean],
                )
                rows = cur.fetchall()
                for parallel_id, score in rows:
                    HadithParallel.objects.update_or_create(
                        hadith=hadith,
                        parallel_hadith_id=parallel_id,
                        defaults={"similarity_score": float(score)},
                    )
                    created += 1
                if rows:
                    Hadith.objects.filter(id=hadith.id).update(has_parallel=True)
        self.stdout.write(self.style.SUCCESS(f"Wrote {created} parallel links"))
