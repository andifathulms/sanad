from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Bookmark, Collection, CollectionItem, ReadingHistory, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Sanad", {"fields": ("preferred_locale", "quranlytics_user_id")}),
    )
    list_display = ("username", "email", "preferred_locale", "is_staff")


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ("user", "hadith", "created_at")
    raw_id_fields = ("user", "hadith")


class CollectionItemInline(admin.TabularInline):
    model = CollectionItem
    raw_id_fields = ("hadith",)
    extra = 0


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "is_public", "created_at")
    inlines = [CollectionItemInline]


@admin.register(ReadingHistory)
class ReadingHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "hadith", "read_at")
    raw_id_fields = ("user", "hadith")
