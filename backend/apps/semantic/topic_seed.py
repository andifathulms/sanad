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
    ("purification", "Purification", "Bersuci", "الطهارة",
     ["ablution", "wudu", "purification", "ghusl"]),
    ("marriage", "Marriage", "Pernikahan", "النكاح",
     ["marriage", "marry", "wife", "husband", "divorce"]),
    ("repentance", "Repentance", "Taubat", "التوبة",
     ["repentance", "repent", "forgiveness", "forgive"]),
    ("patience", "Patience", "Sabar", "الصبر", ["patience", "patient", "perseverance"]),
    ("jihad", "Jihad", "Jihad", "الجهاد", ["jihad", "martyr", "battle", "fighting"]),
    ("food", "Food & Drink", "Makanan", "الأطعمة", ["food", "eating", "drink", "meal"]),
    ("mosque", "The Mosque", "Masjid", "المسجد", ["mosque", "masjid"]),
    ("quran", "The Qur'an", "Al-Qur'an", "القرآن", ["recite the qur", "recitation", "surah"]),
    ("afterlife", "The Afterlife", "Akhirat", "الآخرة",
     ["paradise", "hellfire", "resurrection", "day of judgment"]),
    ("death", "Death & Graves", "Kematian", "الجنائز", ["funeral", "grave", "dying", "deceased"]),
    ("manners", "Good Manners", "Akhlak", "الأخلاق",
     ["kindness", "mercy", "neighbour", "neighbor", "good manners"]),
    ("oaths", "Oaths & Vows", "Sumpah", "الأيمان", ["oath", "vow", "swear by"]),
]
