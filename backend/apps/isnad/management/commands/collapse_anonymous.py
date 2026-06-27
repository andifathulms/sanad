"""Collapse anonymous/relational narrators into the unnamed-narrator sentinel.

Names that are not real (relational like أبي / أبيه / جده, or fragments like
رجل, ح و) are *mubham* — unidentified. This command:

  • reassigns their chain positions to a single sentinel narrator (so the chain
    still shows "[unnamed narrator]" there),
  • drops their transmission edges entirely (no false hub in the graph),
  • marks every affected hadith's chain_type as munqati' (the documented chain
    contains an unnamed break).

Dry run by default; pass --apply. Re-run build_narrator_graph /
compute_centrality / narrator stats afterwards (the graph changed).
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q

from apps.hadith.models import Hadith
from apps.isnad.anonymous import SENTINEL_NAME_AR, get_or_create_sentinel
from apps.isnad.extraction import is_plausible_name, refine_name
from apps.isnad.models import HadithNarrator, Narrator, NarratorLink


def _is_anonymous(name: str) -> bool:
    return not is_plausible_name(refine_name(name))


class Command(BaseCommand):
    help = "Collapse unnamed/relational narrators into the sentinel; mark chains munqati'."

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true")

    def handle(self, *args, **opts):
        apply = opts["apply"]

        placeholders = [
            n
            for n in Narrator.objects.exclude(name_arabic=SENTINEL_NAME_AR).only(
                "id", "name_arabic", "total_hadiths"
            )
            if _is_anonymous(n.name_arabic)
        ]
        ids = [p.id for p in placeholders]
        affected_hadiths = set(
            HadithNarrator.objects.filter(narrator_id__in=ids).values_list("hadith_id", flat=True)
        )

        self.stdout.write(
            f"anonymous narrators: {len(placeholders)} | affected hadiths: {len(affected_hadiths)}"
        )
        for p in sorted(placeholders, key=lambda x: -x.total_hadiths)[:15]:
            self.stdout.write(f"  {p.total_hadiths:>5} | {p.name_arabic[:50]}")

        if not apply:
            self.stdout.write(self.style.WARNING("dry run — pass --apply to write"))
            return

        sentinel = get_or_create_sentinel()
        for p in placeholders:
            with transaction.atomic():
                for hn in HadithNarrator.objects.filter(narrator=p):
                    clash = HadithNarrator.objects.filter(
                        hadith_id=hn.hadith_id, narrator=sentinel, position=hn.position
                    ).exists()
                    if clash:
                        hn.delete()
                    else:
                        HadithNarrator.objects.filter(pk=hn.pk).update(narrator=sentinel)
                # Drop transmission edges so the sentinel is NOT in the graph.
                NarratorLink.objects.filter(Q(teacher=p) | Q(student=p)).delete()
                p.delete()

        updated = (
            Hadith.objects.filter(id__in=affected_hadiths)
            .exclude(chain_type="munqati")
            .update(chain_type="munqati")
        )
        # Sentinel's own appearance count, for reference.
        sentinel.total_hadiths = (
            HadithNarrator.objects.filter(narrator=sentinel).values("hadith").distinct().count()
        )
        sentinel.save(update_fields=["total_hadiths"])
        self.stdout.write(self.style.SUCCESS(
            f"collapsed {len(placeholders)} narrators into sentinel; "
            f"marked {updated} hadiths munqati'; sentinel now in "
            f"{sentinel.total_hadiths} hadiths"
        ))
