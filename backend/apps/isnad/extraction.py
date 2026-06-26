"""Heuristic isnad (chain) extraction from the Arabic matn.

Classical hadith text opens with the sanad — a sequence of narrators joined by
transmission terms (حَدَّثَنَا "narrated to us", أَخْبَرَنِي "informed me", عَنْ "from",
سَمِعْتُ "I heard") — before the matn (the Prophet's words) begins. We segment that
opening region and pull out the narrator names.

This is a STRUCTURAL heuristic, not a rijal authority. It recovers *who narrated from
whom*; it never assigns a reliability grade — narrators land as `unknown` until real
rijal data (sunnah.com / curated Tahdhib) is sourced. Mursal/complex chains and rare
spellings produce noisy spans by design (see CLAUDE.md known quirks).
"""
from __future__ import annotations

import re

from apps.hadith.text_utils import normalize_arabic, strip_tashkeel

# Transmission verbs that delimit narrators. Longer forms first so the regex
# alternation prefers them; عن/سمع are matched as whole words to avoid catching
# عَنه (honorific) or سمعت.
_MARKERS = (
    r"حدثناه|حدثنا|حدثني|أخبرناه|اخبرنا|أخبرنا|اخبرني|أخبرني|"
    r"أنبأنا|انبانا|أنبأني|انباني|سمعته|سمعت|\bسمع\b|\bعن\b"
)
_MARKER_RE = re.compile(f"({_MARKERS})")

# Once any of these appears, the isnad is over and the matn has begun.
_PROPHET_MARKERS = ("رسول الله", "رسول اللـه", "النبي", "نبي الله")

# Honorific phrases removed before splitting (عَنه inside رضي الله عنه would
# otherwise be mistaken for the connector عن).
_HONORIFICS = (
    "رضي الله عنهما", "رضي الله عنهم", "رضي الله عنها", "رضي الله عنه",
    "رضى الله عنهما", "رضى الله عنهم", "رضى الله عنها", "رضى الله عنه",
    "رحمه الله", "صلى الله عليه وسلم", "عليه السلام",
)

# Connective/verb residue stripped from a name span.
_RESIDUE_RE = re.compile(r"\b(قال|قالت|يقول|وقال|أنه|انه|أنها|انها|أن|ان|سمع|يعني)\b")

# Bare relational tokens that are not proper names (would collapse into false hubs).
_RELATIONAL = {"أبيه", "ابيه", "جده", "أمه", "امه", "عمه", "خاله", "أبيها", "ابيها"}

MIN_NAME_LEN = 3
MAX_NAME_LEN = 45


def _clean_name(span: str) -> str:
    span = re.sub(r"[،:.()\"\-–]", " ", span)
    span = _RESIDUE_RE.sub(" ", span)
    return re.sub(r"\s+", " ", span).strip()


def extract_chain(matn_arabic: str) -> list[str]:
    """Return the ordered narrator names, collector-first → companion-last."""
    text = strip_tashkeel(matn_arabic or "")
    for honor in _HONORIFICS:
        text = text.replace(honor, " ")

    boundary = len(text)
    for marker in _PROPHET_MARKERS:
        idx = text.find(marker)
        if idx != -1:
            boundary = min(boundary, idx)
    isnad = text[:boundary]

    parts = _MARKER_RE.split(isnad)
    names: list[str] = []
    # parts = [pre, marker, span, marker, span, ...]; a name is the span after a marker
    for i in range(1, len(parts), 2):
        span = parts[i + 1] if i + 1 < len(parts) else ""
        name = _clean_name(span)
        if not name or name in _RELATIONAL:
            continue
        if MIN_NAME_LEN <= len(name) <= MAX_NAME_LEN:
            names.append(name)
    return names


def dedup_key(name: str) -> str:
    """Normalized key for collapsing spelling variants of the same narrator."""
    return normalize_arabic(name)
