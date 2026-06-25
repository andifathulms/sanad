"""Arabic text normalization helpers.

`matn_clean` is the diacritic-stripped, normalized form used for search and word
frequency. The original `matn_arabic` is ALWAYS preserved untouched — Hadith text
must never be altered (see CLAUDE.md). camel_tools is preferred when available;
we fall back to a regex normalizer so ingestion works without the heavy dependency.
"""
from __future__ import annotations

import re

# Arabic diacritics (tashkeel) + tatweel
_TASHKEEL = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]")
# Quranic verse-0 bismillah variants some collections prepend
_BISMILLAH = re.compile(r"بِسْمِ\s*اللَّهِ\s*الرَّحْمَٰنِ\s*الرَّحِيمِ\s*")


def strip_tashkeel(text: str) -> str:
    return _TASHKEEL.sub("", text or "")


def normalize_arabic(text: str) -> str:
    """Return a search-friendly form: tashkeel removed, letters unified."""
    if not text:
        return ""
    try:
        # Prefer camel_tools if installed (handles alef/ya/ta-marbuta robustly)
        from camel_tools.utils.normalize import (
            normalize_alef_ar,
            normalize_alef_maksura_ar,
            normalize_teh_marbuta_ar,
        )

        text = strip_tashkeel(text)
        text = normalize_alef_ar(text)
        text = normalize_alef_maksura_ar(text)
        text = normalize_teh_marbuta_ar(text)
    except ImportError:
        text = strip_tashkeel(text)
        text = re.sub(r"[إأآا]", "ا", text)
        text = text.replace("ى", "ي").replace("ة", "ه")
    return re.sub(r"\s+", " ", text).strip()


def strip_leading_bismillah(text: str) -> str:
    """Drop a leading bismillah (verse 0) for matn analysis — original kept elsewhere."""
    return _BISMILLAH.sub("", text or "", count=1).strip()
