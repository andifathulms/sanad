"""Grade parsing from fawazahmed0's free-text per-scholar grades."""
import pytest

from apps.hadith.management.commands.ingest_corpus import map_grade, pick_grade


@pytest.mark.parametrize(
    "text,expected",
    [
        ("Hasan Sahih", "sahih"),  # sahih wins over hasan
        ("Sahih Lighairihi", "sahih"),
        ("Hasan", "hasan"),
        ("Daif", "daif"),
        ("Shadh", "daif"),
        ("Maudu", "maudu"),
        ("", "unknown"),
        ("Isnaad Sahih", "sahih"),
    ],
)
def test_map_grade(text, expected):
    assert map_grade(text) == expected


def test_pick_grade_prefers_albani():
    grades = [
        {"name": "Zubair Ali Zai", "grade": "Daif"},
        {"name": "Al-Albani", "grade": "Sahih"},
    ]
    grade, source = pick_grade(grades, "abudawud", "Abu Dawud")
    assert (grade, source) == ("sahih", "Al-Albani")


def test_pick_grade_bukhari_defaults_sahih_with_author_source():
    grade, source = pick_grade([], "bukhari", "Imam al-Bukhari")
    assert grade == "sahih"
    assert source == "Imam al-Bukhari"  # never platform-asserted


def test_pick_grade_unknown_when_no_grades_and_not_intrinsic():
    grade, source = pick_grade([], "tirmidhi", "al-Tirmidhi")
    assert grade == "unknown"
    assert source == ""
