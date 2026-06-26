"""Isnad extraction heuristics. Uses the canonical Bukhari #1 chain (the hadith
of intentions) as a fixture — its sanad is unambiguous."""
from apps.isnad.extraction import dedup_key, extract_chain

BUKHARI_1 = (
    "حَدَّثَنَا الْحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ ، قَالَ : حَدَّثَنَا سُفْيَانُ ، قَالَ : "
    "حَدَّثَنَا يَحْيَى بْنُ سَعِيدٍ الْأَنْصَارِيُّ ، قَالَ : أَخْبَرَنِي مُحَمَّدُ بْنُ إِبْرَاهِيمَ التَّيْمِيُّ ، "
    "أَنَّهُ سَمِعَ عَلْقَمَةَ بْنَ وَقَّاصٍ اللَّيْثِيَّ ، يَقُولُ : سَمِعْتُ عُمَرَ بْنَ الْخَطَّابِ "
    "رَضِيَ اللَّهُ عَنْهُ عَلَى الْمِنْبَرِ، قَالَ : سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ يَقُولُ : "
    "إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ"
)


def test_extracts_ordered_chain():
    names = extract_chain(BUKHARI_1)
    # collector-first; the six transmitters of this chain
    assert names[0].startswith("الحميدي")
    assert "سفيان" in names[1]
    assert any("يحيى بن سعيد" in n for n in names)
    assert any("علقمة" in n for n in names)
    # the matn must not leak in — chain stops at رسول الله
    assert all("الأعمال" not in n for n in names)


def test_honorific_does_not_split_on_an():
    # رضي الله عنه contains عَنه; it must not be split as the connector عن
    names = extract_chain(BUKHARI_1)
    assert any("عمر بن الخطاب" in n for n in names)


def test_short_or_isnadless_text_yields_nothing():
    assert extract_chain("إنما الأعمال بالنيات") == []
    assert extract_chain("") == []


def test_dedup_key_unifies_spelling_variants():
    # alef/ya normalization collapses variant spellings to one key
    assert dedup_key("يحيى بن سعيد") == dedup_key("يحيي بن سعيد")
