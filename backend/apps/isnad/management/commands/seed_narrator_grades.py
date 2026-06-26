"""Apply the curated reliability seed to extracted narrators.

Usage: python manage.py seed_narrator_grades [--dry-run]

Matches each seed entry to narrators by the same normalized key the extractor uses,
then writes the classical generation / reliability_grade / death year / bio_source.
Grades are attributed to their rijāl source — the platform asserts nothing itself.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand

from apps.isnad.extraction import dedup_key
from apps.isnad.models import Narrator
from apps.isnad.reliability_seed import SEED


class Command(BaseCommand):
    help = "Apply curated classical reliability grades to matching narrators."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **opts):
        dry = opts["dry_run"]
        graded = matched = 0
        for name, generation, reliability, death_ah, source in SEED:
            key = dedup_key(name)
            qs = Narrator.objects.all()
            # match on the normalized key by comparing against each candidate; the set
            # is tiny per seed name because names are distinctive
            ids = [n.id for n in qs.filter(name_arabic__icontains=name.split()[0]) if dedup_key(n.name_arabic) == key]
            if not ids:
                self.stderr.write(self.style.WARNING(f"no match: {name}"))
                continue
            matched += 1
            if dry:
                self.stdout.write(f"would grade {name} → {reliability} ({len(ids)} row[s])")
                continue
            updated = Narrator.objects.filter(id__in=ids).update(
                generation=generation,
                reliability_grade=reliability,
                death_year_ah=death_ah,
                bio_source=source,
                reliability_notes=f"Graded {reliability} per {source}.",
            )
            graded += updated

        verb = "Would apply" if dry else "Applied"
        self.stdout.write(
            self.style.SUCCESS(
                f"{verb} grades: {matched}/{len(SEED)} seed names matched, "
                f"{graded} narrator rows graded"
            )
        )
