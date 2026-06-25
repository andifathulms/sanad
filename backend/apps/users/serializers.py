from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.hadith.serializers import HadithListSerializer

from .models import Bookmark, Collection, CollectionItem, ReadingHistory

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "preferred_locale"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "preferred_locale"]


class BookmarkSerializer(serializers.ModelSerializer):
    hadith_detail = HadithListSerializer(source="hadith", read_only=True)

    class Meta:
        model = Bookmark
        fields = ["id", "hadith", "hadith_detail", "note", "created_at"]
        read_only_fields = ["created_at"]


class CollectionItemSerializer(serializers.ModelSerializer):
    hadith_detail = HadithListSerializer(source="hadith", read_only=True)

    class Meta:
        model = CollectionItem
        fields = ["id", "hadith", "hadith_detail", "position", "added_at"]
        read_only_fields = ["added_at"]


class CollectionSerializer(serializers.ModelSerializer):
    items = CollectionItemSerializer(many=True, read_only=True)

    class Meta:
        model = Collection
        fields = ["id", "name", "description", "is_public", "items", "created_at"]
        read_only_fields = ["created_at"]


class ReadingHistorySerializer(serializers.ModelSerializer):
    hadith_detail = HadithListSerializer(source="hadith", read_only=True)

    class Meta:
        model = ReadingHistory
        fields = ["id", "hadith", "hadith_detail", "read_at"]
        read_only_fields = ["read_at"]
