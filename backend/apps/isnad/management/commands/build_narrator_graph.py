"""Build the narrator link graph from sanad data and cache the global payload.

Usage: python manage.py build_narrator_graph

Derives NarratorLink (teacher -> student) edges from each hadith's ordered chain
(HadithNarrator.position), then runs the Celery graph build to cache the global
network payload. Heavy graph work is delegated to the 'graph' queue.
"""
from __future__ import annotations

from collections import defaultdict

from django.core.management.base import BaseCommand

from apps.isnad.models import HadithNarrator, NarratorLink
from apps.isnad.tasks import build_narrator_graph


class Command(BaseCommand):
    help = "Build NarratorLink edges from chains, then cache the global graph."

    def handle(self, *args, **opts):
        # edge -> {hadith_count, set(book_ids)}
        edges: dict[tuple[int, int], dict] = defaultdict(
            lambda: {"count": 0, "books": set()}
        )

        chains: dict[int, list] = defaultdict(list)
        rows = (
            HadithNarrator.objects.select_related("hadith")
            .order_by("hadith_id", "position")
            .values_list("hadith_id", "narrator_id", "hadith__book_id")
        )
        for hadith_id, narrator_id, book_id in rows:
            chains[hadith_id].append((narrator_id, book_id))

        for chain in chains.values():
            # position 1 = closest to Prophet; teacher is the earlier (lower) position
            for (teacher_id, book_id), (student_id, _) in zip(chain, chain[1:]):
                edge = edges[(teacher_id, student_id)]
                edge["count"] += 1
                edge["books"].add(book_id)

        NarratorLink.objects.all().delete()
        NarratorLink.objects.bulk_create(
            [
                NarratorLink(
                    teacher_id=t,
                    student_id=s,
                    hadith_count=meta["count"],
                    book_ids=sorted(meta["books"]),
                )
                for (t, s), meta in edges.items()
            ],
            batch_size=1000,
        )
        self.stdout.write(self.style.SUCCESS(f"Built {len(edges)} narrator links"))

        result = build_narrator_graph()  # runs inline if no worker; cached payload
        self.stdout.write(self.style.SUCCESS(f"Cached global graph: {result}"))
