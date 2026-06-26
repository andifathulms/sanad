"""Reader API + the core grading-display invariant: a grade is never surfaced
without the scholar it is attributed to."""
import pytest

pytestmark = pytest.mark.django_db


def test_books_list(api, book):
    res = api.get("/api/v1/books/")
    assert res.status_code == 200
    assert res.data["results"][0]["slug"] == "bukhari"


def test_book_chapters(api, book, chapter):
    res = api.get(f"/api/v1/books/{book.slug}/chapters/")
    assert res.status_code == 200
    assert res.data[0]["title_en"] == "Revelation"


def test_book_hadiths_paginated(api, book, hadith):
    res = api.get(f"/api/v1/books/{book.slug}/hadiths/")
    assert res.status_code == 200
    assert res.data["count"] == 1
    assert res.data["results"][0]["global_reference"] == "bukhari:1"


def test_hadith_detail_preserves_arabic_verbatim(api, hadith):
    res = api.get(f"/api/v1/hadiths/{hadith.id}/")
    assert res.status_code == 200
    # Arabic matn must come back exactly as stored — never altered/truncated
    assert res.data["matn_arabic"] == hadith.matn_arabic


def test_grade_always_carries_source(api, hadith):
    res = api.get(f"/api/v1/hadiths/{hadith.id}/")
    assert res.data["grade"] == "sahih"
    assert res.data["grade_source"]  # non-empty attribution


def test_search_english(api, hadith):
    res = api.get("/api/v1/search/", {"q": "intentions", "lang": "en"})
    assert res.status_code == 200
    assert res.data["count"] == 1


def test_search_arabic_clean(api, hadith):
    res = api.get("/api/v1/search/", {"q": "الاعمال", "lang": "ar"})
    assert res.data["count"] == 1


def test_search_empty_query_returns_nothing(api, hadith):
    res = api.get("/api/v1/search/", {"q": "", "lang": "en"})
    assert res.data["count"] == 0
