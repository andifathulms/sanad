from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from . import services


class WordFrequencyView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        word = request.query_params.get("word", "").strip()
        book = request.query_params.get("book")
        if not word:
            return Response({"detail": "word is required"}, status=400)
        return Response(services.get_word_frequency_hadith(word, book))


class MatnSimilarityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        hadith_id = request.query_params.get("hadith_id")
        threshold = float(request.query_params.get("threshold", 0.7))
        if not hadith_id:
            return Response({"detail": "hadith_id is required"}, status=400)
        return Response({"similar": services.find_similar_hadiths(int(hadith_id), threshold)})


class GradeDistributionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(services.get_grade_distribution(request.query_params.get("book")))


class NarratorCentralityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        top = int(request.query_params.get("top", 20))
        return Response({"narrators": services.get_narrator_centrality(top)})


class MutabiShahidView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        hadith_id = request.query_params.get("hadith_id")
        if not hadith_id:
            return Response({"detail": "hadith_id is required"}, status=400)
        return Response(services.find_mutabi_shahid(int(hadith_id)))


class OverviewView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(services.get_corpus_overview())
