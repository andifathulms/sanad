"""Network + shortest-path isnad APIs over a tiny hand-built chain."""
import pytest

from apps.isnad.models import HadithNarrator, Narrator, NarratorLink

pytestmark = pytest.mark.django_db


@pytest.fixture
def chain(hadith):
    # teacher (Prophet-side) -> ... -> student (collector-side)
    a = Narrator.objects.create(
        name_arabic="عمر", name_transliteration="Umar", name_en="Umar",
        generation="sahabi", reliability_grade="thiqah", total_hadiths=2, centrality_score=0.9,
    )
    b = Narrator.objects.create(
        name_arabic="علقمة", name_transliteration="Alqama", name_en="Alqama",
        generation="tabii", reliability_grade="thiqah", total_hadiths=1, centrality_score=0.5,
    )
    HadithNarrator.objects.create(hadith=hadith, narrator=a, position=1)
    HadithNarrator.objects.create(hadith=hadith, narrator=b, position=2)
    NarratorLink.objects.create(teacher=a, student=b, hadith_count=1)
    return a, b


def test_global_network_returns_nodes_and_edges(api, chain):
    res = api.get("/api/v1/network/global/", {"limit": 10})
    assert res.status_code == 200
    assert res.data["total_narrators"] == 2
    assert len(res.data["nodes"]) == 2
    # the single teacher->student edge is between two included nodes
    assert len(res.data["edges"]) == 1
    # nodes carry a reliability colour for the D3 renderer
    assert res.data["nodes"][0]["color"].startswith("#")


def test_global_network_filters_by_reliability(api, chain):
    res = api.get("/api/v1/network/global/", {"reliability": "daif"})
    assert res.data["total_narrators"] == 0


def test_shortest_path_between_narrators(api, chain):
    a, b = chain
    res = api.get("/api/v1/narrators/path/", {"from": a.id, "to": b.id})
    assert res.status_code == 200
    assert [p["id"] for p in res.data["path"]] == [a.id, b.id]
    assert res.data["length"] == 1


def test_shortest_path_requires_params(api):
    assert api.get("/api/v1/narrators/path/", {"from": "x"}).status_code == 400
