from django.contrib import admin

from .models import (
    Book,
    Chapter,
    Hadith,
    HadithGrading,
    HadithParallel,
    HadithQuranRef,
)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("slug", "name_en", "collection_type", "total_hadiths", "source_api")
    list_filter = ("collection_type", "source_api")
    search_fields = ("slug", "name_en", "name_arabic", "author")


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ("book", "number", "title_en", "hadith_count")
    list_filter = ("book",)
    search_fields = ("title_en", "title_arabic")


@admin.register(Hadith)
class HadithAdmin(admin.ModelAdmin):
    list_display = (
        "global_reference",
        "book",
        "number_in_book",
        "grade",
        "grade_source",
        "has_parallel",
    )
    list_filter = ("book", "grade", "chain_type", "source_api")
    search_fields = ("global_reference", "matn_clean", "translation_en")
    raw_id_fields = ("chapter",)


@admin.register(HadithParallel)
class HadithParallelAdmin(admin.ModelAdmin):
    list_display = ("hadith", "parallel_hadith", "similarity_score")
    raw_id_fields = ("hadith", "parallel_hadith")


@admin.register(HadithQuranRef)
class HadithQuranRefAdmin(admin.ModelAdmin):
    list_display = ("hadith", "surah_number", "verse_number", "relevance_type")
    raw_id_fields = ("hadith",)


@admin.register(HadithGrading)
class HadithGradingAdmin(admin.ModelAdmin):
    list_display = ("hadith", "grade", "scholar", "source")
    list_filter = ("grade", "scholar")
    search_fields = ("scholar", "source")
    raw_id_fields = ("hadith",)
