"""The curated grade seed must stay consistent and apply by normalized key."""
import pytest

from apps.isnad.extraction import dedup_key
from apps.isnad.models import Narrator
from apps.isnad.reliability_seed import SEED

VALID_GENERATIONS = {"sahabi", "tabii", "taba_tabii", "later", "collector", "unknown"}
VALID_RELIABILITY = {"thiqah", "saduq", "daif", "majhul", "matruk", "unknown"}


def test_seed_entries_are_well_formed():
    for name, generation, reliability, death_ah, source in SEED:
        assert name.strip()
        assert generation in VALID_GENERATIONS
        assert reliability in VALID_RELIABILITY
        assert death_ah is None or 0 < death_ah < 400
        assert source  # every grade carries an attribution — never platform-asserted


def test_seed_keys_are_unique():
    keys = [dedup_key(name) for name, *_ in SEED]
    # a couple of intentional aliases (الزهري / ابن شهاب, أنس / أنس بن مالك) are allowed,
    # but the vast majority should be distinct people
    assert len(set(keys)) >= len(keys) - 4


@pytest.mark.django_db
def test_command_grades_matching_narrator():
    from django.core.management import call_command

    Narrator.objects.create(
        name_arabic="مالك",
        name_transliteration="Malik",
        name_en="Malik",
        generation="unknown",
        reliability_grade="unknown",
    )
    call_command("seed_narrator_grades")
    malik = Narrator.objects.get(name_arabic="مالك")
    assert malik.reliability_grade == "thiqah"
    assert malik.generation == "taba_tabii"
    assert malik.bio_source  # attributed
