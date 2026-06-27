"""Apply the curated Hadith ↔ Qur'an cross-reference seed.

Usage: python manage.py seed_quran_refs [--dry-run]

Matches each seed entry to a hadith by global_reference and upserts a
HadithQuranRef. Entries whose hadith is not present are skipped (numbering
varies across source APIs). The seed is illustrative and scholar-reviewable.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.hadith.models import Hadith, HadithQuranRef
from apps.hadith.quran_ref_seed import SEED


class Command(BaseCommand):
    help = "Seed curated Hadith ↔ Qur'an cross-references."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **opts):
        dry = opts["dry_run"]
        created = matched = 0
        for ref, surah, verse, relevance in SEED:
            try:
                hadith = Hadith.objects.get(global_reference=ref)
            except Hadith.DoesNotExist:
                self.stderr.write(self.style.WARNING(f"no hadith: {ref}"))
                continue
            matched += 1
            if dry:
                self.stdout.write(f"would link {ref} → Q{surah}:{verse} ({relevance})")
                continue
            _, was_created = HadithQuranRef.objects.get_or_create(
                hadith=hadith,
                surah_number=surah,
                verse_number=verse,
                defaults={"relevance_type": relevance},
            )
            created += int(was_created)
        self.stdout.write(
            self.style.SUCCESS(
                f"matched {matched}/{len(SEED)} seed entries; created {created} refs"
                + (" (dry-run)" if dry else "")
            )
        )
