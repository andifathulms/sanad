"""Create curated topics and attach hadiths by English keyword.

Usage: python manage.py seed_topics [--per-topic N]

Keyword tagging only (not request-time work): for each seed topic, links up to
N hadiths whose English translation mentions any keyword. Idempotent via
get_or_create on both Topic and HadithTopic.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db.models import Q

from apps.hadith.models import Hadith
from apps.semantic.models import HadithTopic, Topic
from apps.semantic.topic_seed import SEED


class Command(BaseCommand):
    help = "Seed curated topics and keyword-tag hadiths into them."

    def add_arguments(self, parser):
        parser.add_argument("--per-topic", type=int, default=200)

    def handle(self, *args, **opts):
        limit = opts["per_topic"]
        for slug, name_en, name_id, name_ar, keywords in SEED:
            topic, _ = Topic.objects.get_or_create(
                slug=slug,
                defaults={"name_en": name_en, "name_id": name_id, "name_arabic": name_ar},
            )
            q = Q()
            for kw in keywords:
                q |= Q(translation_en__icontains=kw)
            matches = Hadith.objects.filter(q).values_list("id", flat=True)
            # limit <= 0 → link every match, so the topic count reflects the true
            # number of narrations (varied), not a flat cap.
            hadiths = matches if limit <= 0 else matches[:limit]
            linked = 0
            for hid in hadiths:
                _, created = HadithTopic.objects.get_or_create(
                    hadith_id=hid, topic=topic, defaults={"relevance": 1.0}
                )
                linked += int(created)
            self.stdout.write(f"{slug}: +{linked} hadiths")
        self.stdout.write(self.style.SUCCESS(f"seeded {len(SEED)} topics"))
