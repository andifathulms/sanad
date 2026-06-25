from django.contrib import admin

from .models import BookGradeStats, NarratorStats, WordFrequencyHadith


@admin.register(WordFrequencyHadith)
class WordFrequencyHadithAdmin(admin.ModelAdmin):
    list_display = ("lemma", "total_count")
    search_fields = ("lemma",)


@admin.register(NarratorStats)
class NarratorStatsAdmin(admin.ModelAdmin):
    list_display = ("narrator", "total_hadiths", "teacher_count", "student_count", "centrality_score")
    raw_id_fields = ("narrator",)


@admin.register(BookGradeStats)
class BookGradeStatsAdmin(admin.ModelAdmin):
    list_display = ("book", "sahih", "hasan", "daif", "maudu", "unknown")
