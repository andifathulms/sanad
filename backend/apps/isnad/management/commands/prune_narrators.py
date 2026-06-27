"""Clean up noisy extracted narrators.

The heuristic isnad extractor sometimes captured the opening word(s) of the
matn (e.g. the verb كان) onto a name, or produced pure matn fragments. This
command:

  • CLEAN/MERGE — trims the trailing matn-word(s); if a real name remains it is
    merged into the canonical narrator of that name (reassigning chain links and
    teacher/student edges), or renamed in place if no canonical row exists.
  • DELETE — pure fragments with no real name remaining are removed, but ONLY
    when low-use (total_hadiths <= --max-delete-uses), so high-impact nodes are
    never silently dropped.
  • REVIEW — implausible names that are high-use (e.g. relational "أبي", or
    "رجل") are left untouched and listed for human judgement.

Default is a dry run. Pass --apply to write. Re-run compute_stats /
build_narrator_graph / compute_centrality afterwards (counts go stale).
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.isnad.extraction import dedup_key, is_plausible_name, refine_name
from apps.isnad.models import HadithNarrator, Narrator, NarratorLink
from apps.isnad.translit import transliterate


def _merge_into(source: Narrator, target: Narrator) -> None:
    """Move source's chain positions and edges onto target, then delete source."""
    for hn in HadithNarrator.objects.filter(narrator=source):
        clash = HadithNarrator.objects.filter(
            hadith_id=hn.hadith_id, narrator=target, position=hn.position
        ).exists()
        if clash:
            hn.delete()
        else:
            HadithNarrator.objects.filter(pk=hn.pk).update(narrator=target)

    for link in NarratorLink.objects.filter(teacher=source):
        if link.student_id == target.id:
            link.delete()
            continue
        ex = NarratorLink.objects.filter(teacher=target, student_id=link.student_id).first()
        if ex:
            ex.hadith_count += link.hadith_count
            ex.book_ids = list({*(ex.book_ids or []), *(link.book_ids or [])})
            ex.save(update_fields=["hadith_count", "book_ids"])
            link.delete()
        else:
            NarratorLink.objects.filter(pk=link.pk).update(teacher=target)

    for link in NarratorLink.objects.filter(student=source):
        if link.teacher_id == target.id:
            link.delete()
            continue
        ex = NarratorLink.objects.filter(student=target, teacher_id=link.teacher_id).first()
        if ex:
            ex.hadith_count += link.hadith_count
            ex.book_ids = list({*(ex.book_ids or []), *(link.book_ids or [])})
            ex.save(update_fields=["hadith_count", "book_ids"])
            link.delete()
        else:
            NarratorLink.objects.filter(pk=link.pk).update(student=target)

    source.delete()


class Command(BaseCommand):
    help = "Clean/merge/delete noisy extracted narrators."

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true", help="write changes (default: dry run)")
        parser.add_argument("--max-delete-uses", type=int, default=3)

    def handle(self, *args, **opts):
        apply = opts["apply"]
        del_max = opts["max_delete_uses"]

        narrators = list(Narrator.objects.only("id", "name_arabic", "total_hadiths"))

        # Canonical id per dedup key, chosen among plausible names by max usage.
        canon: dict[str, int] = {}
        best: dict[str, int] = {}
        for n in narrators:
            if refine_name(n.name_arabic) == n.name_arabic and is_plausible_name(n.name_arabic):
                key = dedup_key(n.name_arabic)
                if n.total_hadiths >= best.get(key, -1):
                    best[key] = n.total_hadiths
                    canon[key] = n.id

        merged = renamed = deleted = review = 0
        review_rows: list[tuple[int, str]] = []

        for n in narrators:
            if not Narrator.objects.filter(pk=n.id).exists():
                continue  # already merged away
            name = n.name_arabic
            refined = refine_name(name)

            # Untouched, already-clean names.
            if refined == name and is_plausible_name(name):
                continue

            if is_plausible_name(refined):
                key = dedup_key(refined)
                target_id = canon.get(key)
                if target_id and target_id != n.id and Narrator.objects.filter(pk=target_id).exists():
                    merged += 1
                    if apply:
                        with transaction.atomic():
                            _merge_into(n, Narrator.objects.get(pk=target_id))
                else:
                    renamed += 1
                    if apply:
                        n.name_arabic = refined
                        n.name_transliteration = transliterate(refined)
                        n.save(update_fields=["name_arabic", "name_transliteration"])
                    canon[key] = n.id
                continue

            # Implausible: delete only if low-use, else flag for review.
            if n.total_hadiths <= del_max:
                deleted += 1
                if apply:
                    n.delete()
            else:
                review += 1
                review_rows.append((n.total_hadiths, name))

        mode = "APPLIED" if apply else "DRY RUN"
        self.stdout.write(self.style.SUCCESS(
            f"[{mode}] merge={merged} rename={renamed} delete={deleted} review={review}"
        ))
        if review_rows:
            self.stdout.write("Left for manual review (implausible but high-use):")
            for h, name in sorted(review_rows, reverse=True)[:40]:
                self.stdout.write(f"  {h:>5} | {name[:60]}")
