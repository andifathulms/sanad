"""Curated Hadith ↔ Qur'an cross-references (starter set).

Each entry links a hadith (by global_reference) to a Qur'an verse. This is an
illustrative, scholar-reviewable seed — NOT an exhaustive or authoritative
mapping. Expand it via curation; the platform asserts no interpretation, it
only surfaces a connection for the reader to weigh.

Format: (global_reference, surah_number, verse_number, relevance_type)
relevance_type ∈ {"explains", "context", "mentions"}
"""

SEED = [
    # "Actions are but by intentions" — sincerity of worship (Q98:5).
    ("bukhari:1", 98, 5, "context"),
    # Hadith of Jibril — Iman/Islam/Ihsan, knowledge of the Hour (Q31:34).
    ("bukhari:50", 31, 34, "explains"),
    # "None of you believes until he loves for his brother…" — preferring others (Q59:9).
    ("bukhari:13", 59, 9, "context"),
    # The five pillars — establish prayer and give zakah (Q2:43).
    ("bukhari:8", 2, 43, "explains"),
]
