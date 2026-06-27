"""Curated topic seed.

Each topic carries English keyword hints used to attach hadiths whose English
translation mentions them. This is a pragmatic starter for browse-by-topic —
keyword tagging, not semantic interpretation. Embedding-based topic search is
the later Phase-4 upgrade.

Format: (slug, name_en, name_id, name_arabic, [english_keywords])
"""

SEED = [
    ("prayer", "Prayer", "Shalat", "الصلاة", ["prayer", "salah", "pray"]),
    ("fasting", "Fasting", "Puasa", "الصيام", ["fast", "fasting", "ramadan"]),
    ("charity", "Charity", "Sedekah", "الزكاة", ["charity", "zakat", "alms"]),
    ("pilgrimage", "Pilgrimage", "Haji", "الحج", ["pilgrimage", "hajj"]),
    ("knowledge", "Knowledge", "Ilmu", "العلم", ["knowledge", "learn", "teaching"]),
    ("intentions", "Intentions", "Niat", "النية", ["intention", "intentions"]),
    ("trade", "Trade", "Jual Beli", "البيوع", ["trade", "buying", "selling", "business"]),
    ("family", "Family", "Keluarga", "الأسرة", ["parents", "mother", "father", "family"]),
]
