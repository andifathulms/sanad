"""Recompute materialized stats (grade distribution, narrator stats, centrality).

Usage: python manage.py compute_stats

Runs the analytics + graph Celery tasks inline (synchronously) so the command can be
used in ingestion pipelines and CI. In production these run on their queues nightly.
"""
from django.core.management.base import BaseCommand

from apps.analytics.tasks import compute_stats
from apps.isnad.tasks import compute_centrality


class Command(BaseCommand):
    help = "Recompute grade/narrator/word stats and narrator centrality."

    def handle(self, *args, **opts):
        self.stdout.write("Computing narrator centrality…")
        self.stdout.write(self.style.SUCCESS(str(compute_centrality())))
        self.stdout.write("Computing corpus stats…")
        self.stdout.write(self.style.SUCCESS(str(compute_stats())))
