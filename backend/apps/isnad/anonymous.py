"""The 'unnamed narrator' sentinel.

Extracted chains sometimes reference a narrator only relationally — "from his
father", "a man", the taḥwīl symbol ح — with no identifiable name. These are
*mubham* (unnamed) narrators. We represent them with ONE sentinel narrator so
the chain display stays honest ("[unnamed narrator]" at that position), but we
keep the sentinel OUT of the transmission graph (no NarratorLink edges) so
thousands of distinct anonymous links don't collapse into a false hub that
distorts centrality.
"""
from __future__ import annotations

# Stable identity used by both the collapse command and the queries that exclude it.
SENTINEL_NAME_AR = "راو غير مسمى"
SENTINEL_NAME_LATIN = "[unnamed narrator]"


def get_or_create_sentinel():
    from apps.isnad.models import Narrator

    sentinel, _ = Narrator.objects.get_or_create(
        name_arabic=SENTINEL_NAME_AR,
        defaults={
            "name_transliteration": SENTINEL_NAME_LATIN,
            "name_en": "Unnamed narrator",
            "generation": "unknown",
            "reliability_grade": "majhul",
            "reliability_notes": (
                "Placeholder for unnamed (mubham) narrators referenced only "
                "relationally in the chain — e.g. 'his father', 'a man'. Not a "
                "single person; excluded from the transmission graph and rankings."
            ),
        },
    )
    return sentinel
