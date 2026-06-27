from rest_framework import serializers

from .models import Book, Chapter, Hadith, HadithGrading, HadithQuranRef


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = [
            "id", "slug", "name_arabic", "name_en", "name_id",
            "author", "author_arabic", "author_death_ah",
            "collection_type", "total_hadiths", "grade_summary",
        ]


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ["id", "number", "title_arabic", "title_en", "title_id", "hadith_count"]


class QuranRefSerializer(serializers.ModelSerializer):
    class Meta:
        model = HadithQuranRef
        fields = ["surah_number", "verse_number", "relevance_type"]


class GradingSerializer(serializers.ModelSerializer):
    class Meta:
        model = HadithGrading
        fields = ["grade", "scholar", "source", "notes"]


class HadithListSerializer(serializers.ModelSerializer):
    """Lighter payload for list/search results."""

    book_slug = serializers.CharField(source="book.slug", read_only=True)

    class Meta:
        model = Hadith
        fields = [
            "id", "global_reference", "book_slug", "number_in_book",
            "matn_arabic", "translation_en", "translation_id",
            "grade", "grade_source", "has_parallel",
        ]


class HadithDetailSerializer(serializers.ModelSerializer):
    """Full hadith payload. Arabic matn is always returned in full — never truncated."""

    book = BookSerializer(read_only=True)
    chapter = ChapterSerializer(read_only=True)
    quran_refs = QuranRefSerializer(many=True, read_only=True)
    gradings = GradingSerializer(many=True, read_only=True)

    class Meta:
        model = Hadith
        fields = [
            "id", "global_reference", "alt_reference", "number_in_book",
            "book", "chapter",
            "matn_arabic", "matn_clean", "translation_en", "translation_id",
            "translation_en_source", "translation_id_source",
            "grade", "grade_source", "grade_notes",
            "chain_type", "has_parallel", "source_api", "quran_refs", "gradings",
        ]
