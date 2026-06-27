from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.response import Response

from apps.analytics.services import find_similar_hadiths

from .models import Book, Chapter, Hadith
from .serializers import (
    BookSerializer,
    ChapterSerializer,
    HadithDetailSerializer,
    HadithListSerializer,
)


class BookViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    lookup_field = "slug"

    @action(detail=True, methods=["get"])
    def chapters(self, request, slug=None):
        book = self.get_object()
        chapters = book.chapters.all()
        return Response(ChapterSerializer(chapters, many=True).data)

    @action(detail=True, methods=["get"])
    def hadiths(self, request, slug=None):
        book = self.get_object()
        qs = book.hadiths.select_related("book").all()
        chapter = request.query_params.get("chapter")
        grade = request.query_params.get("grade")
        if chapter:
            qs = qs.filter(chapter__number=chapter)
        if grade:
            qs = qs.filter(grade=grade)
        page = self.paginate_queryset(qs)
        serializer = HadithListSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)


class ChapterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Chapter.objects.select_related("book").all()
    serializer_class = ChapterSerializer


class HadithViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Hadith.objects.select_related("book", "chapter")
        .prefetch_related("gradings", "quran_refs")
        .all()
    )
    serializer_class = HadithDetailSerializer
    filterset_fields = ["book__slug", "grade", "chain_type"]

    @action(detail=True, methods=["get"])
    def parallels(self, request, pk=None):
        return Response(find_similar_hadiths(int(pk), threshold=0.0))

    @action(detail=True, methods=["get"], url_path="quran-refs")
    def quran_refs(self, request, pk=None):
        from .serializers import QuranRefSerializer

        hadith = self.get_object()
        return Response(QuranRefSerializer(hadith.quran_refs.all(), many=True).data)


class SearchView(ListAPIView):
    """Full-text search across matn (ar) and translations (en/id)."""

    serializer_class = HadithListSerializer

    def get_queryset(self):
        params = self.request.query_params
        q = params.get("q", "").strip()
        lang = params.get("lang", "en")
        qs = Hadith.objects.select_related("book").all()
        if not q:
            return qs.none()
        if lang == "ar":
            qs = qs.filter(Q(matn_arabic__icontains=q) | Q(matn_clean__icontains=q))
        elif lang == "id":
            qs = qs.filter(translation_id__icontains=q)
        else:
            qs = qs.filter(translation_en__icontains=q)
        if book := params.get("book"):
            qs = qs.filter(book__slug=book)
        if grade := params.get("grade"):
            qs = qs.filter(grade=grade)
        return qs
