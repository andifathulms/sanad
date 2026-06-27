"""Backfill Latin (transliteration) names for narrators.

Usage:
  python manage.py backfill_transliteration [--overwrite] [--dry-run] [--limit N]

By default only fills narrators whose name_transliteration is blank, deriving a
readable Latin form from name_arabic. Use --overwrite to regenerate all. The
transliteration is approximate (see apps/isnad/translit) — curated values are
preferred, so --overwrite is opt-in.
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db.models import Q

from apps.isnad.models import Narrator
from apps.isnad.translit import transliterate

# Rows whose "transliteration" still contains Arabic letters are placeholders
# (the extractor copied name_arabic) — treat them as needing a real Latin form.
_ARABIC = r"[؀-ۿ]"


class Command(BaseCommand):
    help = "Derive Latin transliteration names for narrators from their Arabic names."

    def add_arguments(self, parser):
        parser.add_argument("--overwrite", action="store_true", help="regenerate all rows")
        parser.add_argument("--dry-run", action="store_true")
        parser.add_argument("--limit", type=int, default=0, help="cap rows processed (0 = all)")

    def handle(self, *args, **opts):
        qs = Narrator.objects.exclude(name_arabic="")
        if not opts["overwrite"]:
            # Blank, or still holding the Arabic placeholder.
            qs = qs.filter(Q(name_transliteration="") | Q(name_transliteration__regex=_ARABIC))
        qs = qs.order_by("id")
        if opts["limit"]:
            qs = qs[: opts["limit"]]

        updated = skipped = 0
        samples = []
        to_save = []
        for n in qs.iterator():
            latin = transliterate(n.name_arabic)
            if not latin:
                skipped += 1
                continue
            if len(samples) < 10:
                samples.append(f"  {n.name_arabic}  →  {latin}")
            n.name_transliteration = latin
            to_save.append(n)
            updated += 1
            if not opts["dry_run"] and len(to_save) >= 500:
                Narrator.objects.bulk_update(to_save, ["name_transliteration"])
                to_save.clear()

        if not opts["dry_run"] and to_save:
            Narrator.objects.bulk_update(to_save, ["name_transliteration"])

        self.stdout.write("\n".join(samples))
        verb = "would update" if opts["dry_run"] else "updated"
        self.stdout.write(
            self.style.SUCCESS(f"{verb} {updated} narrator(s); skipped {skipped} (no Arabic name)")
        )
