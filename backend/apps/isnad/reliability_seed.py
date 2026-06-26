"""Curated narrator reliability seed (classical jarḥ wa taʿdīl).

Every grade here is sourced from classical rijāl scholarship — never asserted by the
platform. Companions are ʿudūl (reliable) by ijmāʿ; the rest follow Ibn Ḥajar's
*Taqrīb al-Tahdhīb*, the standard one-word-verdict reference.

Only high-confidence, unambiguous names are included. Ambiguous bare names that the
extractor cannot disambiguate (e.g. عبد الله, حماد, يحيى alone, the relational أبي
"his father") are deliberately omitted rather than risk a wrong attribution.

Each entry: name (must match the extracted name_arabic form), generation, reliability,
optional death year (AH), and the bio source the grade is attributed to.
"""
from __future__ import annotations

_COMPANION = "Companion (ṣaḥābī — ʿadl by ijmāʿ)"
_TAQRIB = "Ibn Ḥajar, Taqrīb al-Tahdhīb"

# (name_arabic, generation, reliability_grade, death_year_ah | None, bio_source)
SEED: list[tuple[str, str, str, int | None, str]] = [
    # --- Companions (ṣaḥāba) ---
    ("أبي هريرة", "sahabi", "thiqah", 57, _COMPANION),
    ("ابن عمر", "sahabi", "thiqah", 73, _COMPANION),
    ("ابن عباس", "sahabi", "thiqah", 68, _COMPANION),
    ("عائشة", "sahabi", "thiqah", 58, _COMPANION),
    ("أنس بن مالك", "sahabi", "thiqah", 93, _COMPANION),
    ("أنس", "sahabi", "thiqah", 93, _COMPANION),
    ("جابر بن عبد الله", "sahabi", "thiqah", 78, _COMPANION),
    ("أبي سعيد الخدري", "sahabi", "thiqah", 74, _COMPANION),
    ("عبد الله بن مسعود", "sahabi", "thiqah", 32, _COMPANION),
    ("المغيرة بن شعبة", "sahabi", "thiqah", 50, _COMPANION),
    ("البراء بن عازب", "sahabi", "thiqah", 72, _COMPANION),
    ("عبد الله بن عمرو", "sahabi", "thiqah", 65, _COMPANION),
    # --- Tābiʿūn ---
    ("الزهري", "tabii", "thiqah", 124, _TAQRIB),
    ("ابن شهاب", "tabii", "thiqah", 124, _TAQRIB),
    ("نافع", "tabii", "thiqah", 117, _TAQRIB),
    ("قتادة", "tabii", "thiqah", 117, _TAQRIB),
    ("عروة", "tabii", "thiqah", 94, _TAQRIB),
    ("هشام بن عروة", "tabii", "thiqah", 146, _TAQRIB),
    ("أبي سلمة", "tabii", "thiqah", 94, _TAQRIB),
    ("الأعرج", "tabii", "thiqah", 117, _TAQRIB),
    ("أبي صالح", "tabii", "thiqah", 101, _TAQRIB),
    ("عطاء", "tabii", "thiqah", 114, _TAQRIB),
    ("عكرمة", "tabii", "thiqah", 104, _TAQRIB),
    ("سعيد بن جبير", "tabii", "thiqah", 95, _TAQRIB),
    ("أبي إسحاق", "tabii", "thiqah", 129, _TAQRIB),
    ("منصور", "tabii", "thiqah", 132, _TAQRIB),
    ("أيوب", "tabii", "thiqah", 131, _TAQRIB),
    ("أبي الزناد", "tabii", "thiqah", 130, _TAQRIB),
    ("أبي الزبير", "tabii", "saduq", 126, _TAQRIB),  # ṣadūq, a known mudallis
    # --- Atbāʿ al-tābiʿīn & major imams ---
    ("مالك", "taba_tabii", "thiqah", 179, _TAQRIB),
    ("شعبة", "taba_tabii", "thiqah", 160, _TAQRIB),
    ("الأعمش", "taba_tabii", "thiqah", 148, _TAQRIB),
    ("الليث", "taba_tabii", "thiqah", 175, _TAQRIB),
    ("معمر", "taba_tabii", "thiqah", 153, _TAQRIB),
    ("سفيان بن عيينة", "taba_tabii", "thiqah", 198, _TAQRIB),
    ("ابن جريج", "taba_tabii", "thiqah", 150, _TAQRIB),
    ("جرير", "taba_tabii", "thiqah", 188, _TAQRIB),
    ("حماد بن زيد", "taba_tabii", "thiqah", 179, _TAQRIB),
    ("أبو معاوية", "taba_tabii", "thiqah", 195, _TAQRIB),
    ("أبو أسامة", "taba_tabii", "thiqah", 201, _TAQRIB),
    ("أبو عوانة", "taba_tabii", "thiqah", 176, _TAQRIB),
    ("شعيب", "taba_tabii", "thiqah", 162, _TAQRIB),
    ("ابن وهب", "taba_tabii", "thiqah", 197, _TAQRIB),
    ("وكيع", "taba_tabii", "thiqah", 197, _TAQRIB),
    ("عبد الرزاق", "taba_tabii", "thiqah", 211, _TAQRIB),
    # --- Later (collectors' direct teachers) ---
    ("قتيبة", "later", "thiqah", 240, _TAQRIB),
    ("قتيبة بن سعيد", "later", "thiqah", 240, _TAQRIB),
    ("مسدد", "later", "thiqah", 228, _TAQRIB),
    ("محمد بن بشار", "later", "thiqah", 252, _TAQRIB),
    ("محمد بن المثنى", "later", "thiqah", 252, _TAQRIB),
    ("محمد بن جعفر", "later", "thiqah", 193, _TAQRIB),
    ("أبو بكر بن أبي شيبة", "later", "thiqah", 235, _TAQRIB),
    ("إسحاق بن إبراهيم", "later", "thiqah", 238, _TAQRIB),
    ("موسى بن إسماعيل", "later", "thiqah", 223, _TAQRIB),
]
