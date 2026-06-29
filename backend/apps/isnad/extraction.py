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
        # Trim trailing matn words (e.g. "أبا هريرة إن" -> "أبا هريرة") and drop spans
        # that hold no real name, so chains carry narrators — not matn fragments.
        name = refine_name(name) or name
        if not is_plausible_name(name):
            continue
        if MIN_NAME_LEN <= len(name) <= MAX_NAME_LEN:
            names.append(name)
    return names


def dedup_key(name: str) -> str:
    """Normalized key for collapsing spelling variants of the same narrator."""
    return normalize_arabic(name)


# --- Post-hoc name refinement (cleanup of noisy extracted spans) -------------
#
# Some extracted "names" captured the opening word(s) of the matn (e.g. the verb
# كان) or are pure matn fragments. We trim a name at the first matn-word and then
# judge whether a real name remains. Tokens are compared whole and normalized —
# never as substrings (التيمي must not match التي).

# Zero-width / bidi control marks that cling to tokens and break exact matching.
_ZERO_WIDTH_RE = re.compile("[​-‏‪-‮﻿]")


def _tok(s: str) -> str:
    s = _ZERO_WIDTH_RE.sub("", strip_tashkeel(s))
    return re.sub(r"[إأآٱ]", "ا", s).replace("ى", "ي").replace("ة", "ه")

# Verbs / pronouns / particles that mark the matn beginning — never part of a name.
_STOPWORDS = {
    _tok(w) for w in (
        "كان", "كانت", "رأى", "رأيت", "رأت", "رأوا", "خرج", "خرجت", "قال", "قالت",
        "قالوا", "يقول", "تقول", "قلت", "قلنا", "جاء", "جاءت", "أتى", "اتى", "دخل",
        "دخلت", "ذهب", "بينا", "بينما", "إذا", "اذا", "لما", "كنت", "كنا", "فقال",
        "فقالت", "وقال", "وقالت", "يا", "هذا", "هذه", "ذلك", "تلك", "الذي", "التي",
        "الذين", "ما", "من", "حين", "يوم", "الناس", "أنه", "انه", "أنها", "انها",
        "أني", "اني", "أنا", "انا", "نحن", "هو", "هي", "هم", "عند", "فلما", "ثم",
        "حتى", "وهو", "وهي", "مر", "مرت", "أقبل", "اقبل", "سئل", "سأل", "سال",
        "نهى", "أمر", "امر", "قام", "قعد", "بعث", "كتب", "نزل", "نزلت",
        # Particles / conjunctions that open the matn after the last narrator.
        "إن", "ان", "أن", "إذ", "اذ", "قد", "لقد", "فإن", "فان", "لكن", "ولكن",
        "إنه", "انه", "إنها", "انها", "إنك", "انك", "إنكم", "انكم", "إنما", "انما",
        # Further verb conjugations (1st/2nd/3rd person) seen captured into spans.
        "أقبلت", "اقبلت", "فقد", "فقدت", "فقدنا", "يكره", "كره", "كرهت", "ذكر",
        "ذكرت", "ذكروا", "ذكرنا", "يذكر", "صحب", "صحبت", "قاعدت", "شهد", "شهدت",
        "أشهد", "اشهد", "يكثر", "كثر", "زعم", "يزعم", "تزعمون", "سمعنا", "شكا",
        "اشتكى", "مرض", "توفي", "مات", "عاد", "سافر", "صلى", "صام", "حج", "اعتمر",
        "غزا", "قدم", "قدمت", "وقع", "وقعت", "فعل", "فعلت", "وجد", "وجدت", "علم",
        "علمت", "عرف", "عرفت", "سمعته", "رايته", "رأيته",
    )
}

# Common matn nouns that are not names — reject even as a lone token.
_MATN_NOUNS = {
    _tok(w) for w in (
        "حديث", "حديثا", "الحديث", "شيء", "شيئا", "كلام", "قول", "خبر", "أمرا",
        "امرا", "حاجة", "حاجه", "سنة", "سنه", "صلاة", "صلاه", "زمان", "وقت",
    )
}

# Function words that can begin a junk span but are not names. A span made *only*
# of these (plus connective particles) is not a real narrator.
_NONNAME = {
    _tok(w) for w in (
        "آخر", "اخر", "أول", "اول", "بعض", "كل", "منهم", "منها", "منهما", "أهل",
        "اهل", "بني", "بنو", "ذات", "ذو", "ناس", "قوم", "رجل", "امرأة", "امراه",
        "الرجل", "المرأة", "المراه", "أبيه", "ابيه", "جده", "أمه", "امه", "عمه",
        "خاله", "أبيها", "ابيها", "أصحاب", "اصحاب",
    )
}

# Connective particles that join name parts but are not standalone names.
_PARTICLES = {_tok(w) for w in ("بن", "ابن", "أبي", "ابي", "أبو", "ابو", "أب", "اب", "أم", "ام")}


def refine_name(name: str) -> str:
    """Trim a name at the first matn-word; returns the leading real-name part."""
    out: list[str] = []
    for word in name.split():
        if _tok(word) in _STOPWORDS:
            break
        out.append(word)
    return " ".join(out).strip()


def is_plausible_name(name: str) -> bool:
    """True if `name` looks like an actual narrator name (not a matn fragment)."""
    toks = name.split()
    if not toks or len(toks) > 12:
        return False
    norm = [_tok(t) for t in toks]
    if any(t in _STOPWORDS for t in norm):
        return False
    # A matn noun anywhere (e.g. "حديثا", or "الصلاة" inside a captured span) marks
    # the span as matn text, not a narrator name — no real name contains these.
    # Compare with the definite article stripped so "الصلاة" matches "صلاة".
    if any((t[2:] if t.startswith("ال") else t) in _MATN_NOUNS for t in norm):
        return False
    # Needs at least one real name token (not a function word / bare particle).
    return any(
        len(t) >= 2 and t not in _NONNAME and t not in _PARTICLES and t not in _MATN_NOUNS
        for t in norm
    )
