from django.contrib import admin

from .models import HadithNarrator, Narrator, NarratorLink, Sanad


@admin.register(Narrator)
class NarratorAdmin(admin.ModelAdmin):
    list_display = (
        "name_transliteration",
        "kunya",
        "generation",
        "reliability_grade",
        "death_year_ah",
        "total_hadiths",
        "centrality_score",
    )
    list_filter = ("generation", "reliability_grade", "region")
    search_fields = ("name_arabic", "name_transliteration", "name_en", "kunya")


@admin.register(NarratorLink)
class NarratorLinkAdmin(admin.ModelAdmin):
    list_display = ("teacher", "student", "hadith_count")
    raw_id_fields = ("teacher", "student")


@admin.register(Sanad)
class SanadAdmin(admin.ModelAdmin):
    list_display = ("hadith",)
    raw_id_fields = ("hadith",)


@admin.register(HadithNarrator)
class HadithNarratorAdmin(admin.ModelAdmin):
    list_display = ("hadith", "narrator", "position")
    raw_id_fields = ("hadith", "narrator")
