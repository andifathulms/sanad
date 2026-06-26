import pytest
from rest_framework.test import APIClient

from apps.hadith.models import Book, Chapter, Hadith


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def book(db):
    return Book.objects.create(
        slug="bukhari",
        name_arabic="صحيح البخاري",
        name_en="Sahih al-Bukhari",
        name_id="Shahih Bukhari",
        author="Imam al-Bukhari",
        author_arabic="البخاري",
        collection_type="sahih",
        source_api="fawazahmed0",
    )


@pytest.fixture
def chapter(book):
    return Chapter.objects.create(
        book=book, number=1, title_en="Revelation", title_arabic="", hadith_count=1
    )


@pytest.fixture
def hadith(book, chapter):
    return Hadith.objects.create(
        book=book,
        chapter=chapter,
        number_in_book=1,
        global_reference="bukhari:1",
        matn_arabic="إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ",
        matn_clean="انما الاعمال بالنيات",
        translation_en="Actions are judged by intentions.",
        grade="sahih",
        grade_source="Imam al-Bukhari",
        source_api="fawazahmed0",
    )
