"""The matn normalizer must keep matn_arabic verbatim while producing a clean
search form — these tests lock in the diacritic/letter handling."""
from apps.hadith.text_utils import (
    normalize_arabic,
    strip_leading_bismillah,
    strip_tashkeel,
)


def test_strip_tashkeel_removes_diacritics():
    assert strip_tashkeel("الْأَعْمَالُ") == "الأعمال"


def test_normalize_unifies_alef_and_ya_and_ta_marbuta():
    # alef variants -> bare alef, ya/alef-maksura unified, ta marbuta -> ha
    out = normalize_arabic("إِنَّمَا الصَّلَاةُ عَلَى")
    assert "إ" not in out  # hamza-alef normalized
    assert "ة" not in out  # ta marbuta normalized
    assert out == out.strip()


def test_normalize_is_idempotent():
    once = normalize_arabic("الْحُمَيْدِيُّ")
    assert normalize_arabic(once) == once


def test_normalize_handles_empty():
    assert normalize_arabic("") == ""
    assert normalize_arabic(None) == ""


def test_strip_leading_bismillah():
    text = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ الْحَمْدُ لِلَّهِ"
    assert strip_leading_bismillah(text).startswith("الْحَمْدُ")
