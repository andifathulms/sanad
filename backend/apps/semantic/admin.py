from django.contrib import admin

from .models import HadithTopic, Topic


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ("slug", "name_en", "name_id")
    search_fields = ("name_en", "name_id", "name_arabic")


@admin.register(HadithTopic)
class HadithTopicAdmin(admin.ModelAdmin):
    list_display = ("topic", "hadith", "relevance")
    raw_id_fields = ("hadith",)
    list_filter = ("topic",)
