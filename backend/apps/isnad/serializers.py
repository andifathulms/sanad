from rest_framework import serializers

from .models import HadithNarrator, Narrator, Sanad


class NarratorListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Narrator
        fields = [
            "id", "name_arabic", "name_transliteration", "name_en",
            "kunya", "generation", "reliability_grade",
            "death_year_ah", "total_hadiths", "centrality_score",
        ]


class NarratorDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Narrator
        fields = [
            "id", "name_arabic", "name_transliteration", "name_en",
            "kunya", "laqab", "nasab",
            "birth_year_ah", "death_year_ah", "birth_year_ce", "death_year_ce",
            "generation", "region",
            "reliability_grade", "reliability_notes", "bio_source",
            "total_hadiths", "centrality_score",
        ]


class ChainNarratorSerializer(serializers.ModelSerializer):
    """A narrator as positioned within a specific hadith's chain."""

    narrator = NarratorListSerializer(read_only=True)

    class Meta:
        model = HadithNarrator
        fields = ["position", "narrator"]


class SanadSerializer(serializers.ModelSerializer):
    chain = serializers.SerializerMethodField()

    class Meta:
        model = Sanad
        fields = ["chain_text_arabic", "chain_text_en", "chain_order", "chain"]

    def get_chain(self, obj):
        rows = obj.hadith.chain.select_related("narrator").order_by("position")
        return ChainNarratorSerializer(rows, many=True).data
