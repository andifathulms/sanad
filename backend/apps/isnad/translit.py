"""Approximate Arabic → Latin transliteration for narrator names.

Goal: give non-Arabic readers a readable Latin form when a narrator has no
curated `name_transliteration`. Narrator names are built from a small set of
recurring components (Abu, ibn, Abd, Allah, common given names, nisbas), so a
token dictionary covers the bulk; unknown tokens fall back to a character map.

This is a best-effort aid, NOT scholarly ALA-LC romanization — short vowels are
absent in the script, so the fallback is imperfect by nature. Curated values in
the database always take precedence.
"""
from __future__ import annotations

import re

from apps.hadith.text_utils import strip_tashkeel

# Character-level fallback (no short vowels in the script).
_CHAR_MAP = {
    "ا": "a", "ٱ": "a", "ب": "b", "ت": "t", "ث": "th", "ج": "j", "ح": "h",
    "خ": "kh", "د": "d", "ذ": "dh", "ر": "r", "ز": "z", "س": "s", "ش": "sh",
    "ص": "s", "ض": "d", "ط": "t", "ظ": "z", "ع": "'", "غ": "gh", "ف": "f",
    "ق": "q", "ك": "k", "ل": "l", "م": "m", "ن": "n", "ه": "h", "و": "w",
    "ي": "y", "ى": "a", "ة": "a", "ء": "'", "ئ": "'", "ؤ": "'",
}

# Common name components, keyed by alef-normalized, tashkeel-free Arabic.
_TOKENS = {
    # particles / kinship (kept lowercase where conventional)
    "ابو": "Abu", "ابي": "Abi", "ابا": "Aba", "ابن": "ibn", "بن": "bin",
    "بنت": "bint", "ام": "Umm", "عبد": "Abd", "الله": "Allah",
    # prophets / very common given names
    "محمد": "Muhammad", "احمد": "Ahmad", "علي": "Ali", "عمر": "Umar",
    "عثمان": "Uthman", "ابراهيم": "Ibrahim", "اسماعيل": "Isma'il",
    "اسحاق": "Ishaq", "يعقوب": "Ya'qub", "يوسف": "Yusuf", "موسى": "Musa",
    "عيسى": "Isa", "هارون": "Harun", "داود": "Dawud", "سليمان": "Sulayman",
    "يحيى": "Yahya", "نوح": "Nuh", "صالح": "Salih", "ايوب": "Ayyub",
    "يونس": "Yunus", "زكريا": "Zakariya", "ادريس": "Idris",
    # companions / early figures
    "حسن": "Hasan", "الحسن": "al-Hasan", "حسين": "Husayn",
    "الحسين": "al-Husayn", "حمزة": "Hamza", "عباس": "Abbas",
    "العباس": "al-Abbas", "جعفر": "Ja'far", "طلحة": "Talha",
    "زبير": "Zubayr", "الزبير": "al-Zubayr", "سعد": "Sa'd", "سعيد": "Sa'id",
    "خالد": "Khalid", "زيد": "Zayd", "عمرو": "Amr", "بلال": "Bilal",
    "انس": "Anas", "جابر": "Jabir", "معاذ": "Mu'adh", "هريرة": "Hurayra",
    "عائشة": "A'isha", "خديجة": "Khadija", "فاطمة": "Fatima",
    "حفصة": "Hafsa", "اسماء": "Asma", "ميمونة": "Maymuna", "زينب": "Zaynab",
    # major transmitters
    "سفيان": "Sufyan", "شعبة": "Shu'ba", "مالك": "Malik", "حماد": "Hammad",
    "هشام": "Hisham", "قتادة": "Qatada", "نافع": "Nafi'", "وكيع": "Waki'",
    "عكرمة": "Ikrima", "مجاهد": "Mujahid", "عطاء": "Ata", "سالم": "Salim",
    "القاسم": "al-Qasim", "عروة": "Urwa", "همام": "Hammam", "معمر": "Ma'mar",
    "ليث": "Layth", "الليث": "al-Layth", "جرير": "Jarir", "زهير": "Zuhayr",
    "شريك": "Sharik", "اسرائيل": "Isra'il", "معاوية": "Mu'awiya",
    "وليد": "Walid", "الوليد": "al-Walid", "يزيد": "Yazid", "مروان": "Marwan",
    "عبيد": "Ubayd", "عبيدة": "Ubayda", "مبارك": "Mubarak",
    "عيينة": "Uyayna", "جريج": "Jurayj", "سيرين": "Sirin",
    # "Abd al-…" second elements
    "الرحمن": "al-Rahman", "الرحيم": "al-Rahim", "العزيز": "al-Aziz",
    "الملك": "al-Malik", "الحميد": "al-Hamid", "الصمد": "al-Samad",
    "الجبار": "al-Jabbar", "الكريم": "al-Karim", "الوهاب": "al-Wahhab",
    "الغفار": "al-Ghaffar",
    # nisbas (place / tribe)
    "المدني": "al-Madani", "المكي": "al-Makki", "الكوفي": "al-Kufi",
    "البصري": "al-Basri", "الشامي": "al-Shami", "المصري": "al-Misri",
    "البغدادي": "al-Baghdadi", "الدمشقي": "al-Dimashqi",
    "اليماني": "al-Yamani", "الواسطي": "al-Wasiti", "الانصاري": "al-Ansari",
    "القرشي": "al-Qurashi", "التميمي": "al-Tamimi", "الاسدي": "al-Asadi",
    "السلمي": "al-Sulami", "الزهري": "al-Zuhri", "الثوري": "al-Thawri",
    "الاوزاعي": "al-Awza'i", "الاعمش": "al-A'mash", "النخعي": "al-Nakha'i",
    "الشعبي": "al-Sha'bi", "الاعرج": "al-A'raj", "الجعفي": "al-Ju'fi",
    # more high-frequency given names / rijal
    "مهدي": "Mahdi", "القطان": "al-Qattan", "حجاج": "Hajjaj",
    "الحجاج": "al-Hajjaj", "ربيعة": "Rabi'a", "ابان": "Aban",
    "ثابت": "Thabit", "حميد": "Humayd", "عاصم": "Asim", "بكر": "Bakr",
    "عتبة": "Utba", "عقبة": "Uqba", "شيبة": "Shayba", "حكيم": "Hakim",
    "الحكم": "al-Hakam", "منصور": "Mansur", "مغيرة": "Mughira",
    "المغيرة": "al-Mughira", "مسلم": "Muslim", "اسامة": "Usama",
    "حذيفة": "Hudhayfa", "كعب": "Ka'b", "نعمان": "Nu'man",
    "النعمان": "al-Nu'man", "سمرة": "Samura", "عبادة": "Ubada",
    "رافع": "Rafi'", "مسعود": "Mas'ud", "عطية": "Atiyya",
    "الضحاك": "al-Dahhak", "ضحاك": "Dahhak", "طارق": "Tariq",
    "سهيل": "Suhayl", "صهيب": "Suhayb", "تميم": "Tamim", "عدي": "Adi",
    "حارث": "Harith", "الحارث": "al-Harith", "علقمة": "Alqama",
    "اسود": "Aswad", "الاسود": "al-Aswad", "مسروق": "Masruq",
    "سهل": "Sahl", "اوس": "Aws", "البراء": "al-Bara", "جندب": "Jundub",
    # collectors / nisbas of the books
    "البخاري": "al-Bukhari", "النسائي": "al-Nasa'i",
    "الترمذي": "al-Tirmidhi", "الدارمي": "al-Darimi",
    "ماجه": "Maja", "الخدري": "al-Khudri", "الاشعري": "al-Ash'ari",
    "الزناد": "al-Zinad", "العلاء": "al-Ala",
    # famous shaykhs frequently in the chains
    "سلمة": "Salama", "مسلمة": "Maslama", "القعنبي": "al-Qa'nabi",
    "قعنب": "Qa'nab", "مسدد": "Musaddad", "مسرهد": "Musarhad",
    "الدراوردي": "al-Darawardi", "نعيم": "Nu'aym", "فضل": "Fadl",
    "الفضل": "al-Fadl", "نضر": "Nadr", "النضر": "al-Nadr",
    "عوانة": "Awana", "هشيم": "Hushaym", "حيوة": "Haywa",
    "السبيعي": "al-Sabi'i", "مطرف": "Mutarrif", "بهز": "Bahz",
    "عفان": "Affan", "حبان": "Habban", "الاحوص": "al-Ahwas",
    "سماك": "Simak", "الحضرمي": "al-Hadrami", "كريب": "Kurayb",
    "قبيصة": "Qabisa", "حجر": "Hujr", "قتيبة": "Qutayba",
    "اسحق": "Ishaq",
}


def _norm(tok: str) -> str:
    tok = strip_tashkeel(tok).replace("ـ", "")
    return re.sub(r"[إأآٱ]", "ا", tok)


def _cap(s: str) -> str:
    """Capitalize the first alphabetic character (leave a leading ' alone)."""
    for i, ch in enumerate(s):
        if ch.isalpha():
            return s[:i] + ch.upper() + s[i + 1 :]
    return s


def _char_translit(tok: str) -> str:
    return "".join(_CHAR_MAP.get(ch, "") for ch in tok)


def _translit_token(tok: str) -> str:
    if tok in _TOKENS:
        return _TOKENS[tok]
    if tok.startswith("ال") and len(tok) > 2:
        rest = tok[2:]
        base = _TOKENS.get(rest) or _cap(_char_translit(rest))
        return "al-" + base
    return _TOKENS.get(tok) or _cap(_char_translit(tok))


def transliterate(name_arabic: str) -> str:
    """Return a readable Latin form of an Arabic narrator name (best effort)."""
    if not name_arabic:
        return ""
    tokens = [_norm(t) for t in re.split(r"\s+", name_arabic.strip()) if t.strip()]
    parts = [_translit_token(t) for t in tokens if t]
    return " ".join(p for p in parts if p).strip()
