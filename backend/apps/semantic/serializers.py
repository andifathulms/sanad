from rest_framework import serializers

from .models import Topic


class TopicSerializer(serializers.ModelSerializer):
    hadith_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Topic
        fields = ["id", "slug", "name_en", "name_id", "name_arabic", "hadith_count"]
