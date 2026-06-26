from django.core.cache import cache
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.hadith.models import Hadith

from . import graph as graph_engine
from .models import HadithNarrator, Narrator
from .serializers import (
    ChainNarratorSerializer,
    NarratorDetailSerializer,
    NarratorListSerializer,
)
from .tasks import GRAPH_CACHE_KEY


class NarratorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Narrator.objects.all()
    serializer_class = NarratorDetailSerializer
    filterset_fields = ["generation", "reliability_grade", "region"]

    @action(detail=True, methods=["get"])
    def network(self, request, pk=None):
        depth = int(request.query_params.get("depth", 2))
        return Response(graph_engine.get_narrator_subgraph(int(pk), depth=depth))

    @action(detail=True, methods=["get"])
    def teachers(self, request, pk=None):
        ids = self.get_object().teachers.values_list("teacher_id", flat=True)
        qs = Narrator.objects.filter(id__in=ids)
        return Response(NarratorListSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def students(self, request, pk=None):
        ids = self.get_object().students.values_list("student_id", flat=True)
        qs = Narrator.objects.filter(id__in=ids)
        return Response(NarratorListSerializer(qs, many=True).data)

    @action(detail=True, methods=["get"])
    def hadiths(self, request, pk=None):
        from apps.hadith.serializers import HadithListSerializer

        hadith_ids = HadithNarrator.objects.filter(narrator_id=pk).values_list(
            "hadith_id", flat=True
        )
        qs = Hadith.objects.select_related("book").filter(id__in=hadith_ids)
        page = self.paginate_queryset(qs)
        return self.get_paginated_response(HadithListSerializer(page, many=True).data)


class NarratorSearchView(ListAPIView):
    serializer_class = NarratorListSerializer
    filterset_fields = ["generation", "reliability_grade"]

    def get_queryset(self):
        q = self.request.query_params.get("q", "").strip()
        qs = Narrator.objects.all()
        if q:
            qs = qs.filter(name_arabic__icontains=q) | qs.filter(
                name_transliteration__icontains=q
            )
        return qs


class HadithSanadView(APIView):
    """GET /hadiths/{id}/sanad/ -> chain + graph_data for React Flow."""

    def get(self, request, hadith_id):
        rows = (
            HadithNarrator.objects.filter(hadith_id=hadith_id)
            .select_related("narrator")
            .order_by("position")
        )
        return Response(
            {
                "chain": ChainNarratorSerializer(rows, many=True).data,
                "graph_data": graph_engine.get_hadith_chain_graph(int(hadith_id)),
            }
        )


class IsnadCompareView(APIView):
    """Overlay two chains; report shared narrators and divergence point."""

    def get(self, request):
        h1 = int(request.query_params.get("hadith1"))
        h2 = int(request.query_params.get("hadith2"))

        def chain(h_id):
            return list(
                HadithNarrator.objects.filter(hadith_id=h_id)
                .order_by("position")
                .values_list("narrator_id", flat=True)
            )

        chain1, chain2 = chain(h1), chain(h2)
        shared = sorted(set(chain1) & set(chain2))
        divergence = None
        for i, (a, b) in enumerate(zip(chain1, chain2, strict=False)):
            if a != b:
                divergence = i
                break
        return Response(
            {
                "chain1": chain1,
                "chain2": chain2,
                "shared_narrators": shared,
                "divergence_point": divergence,
            }
        )


class GlobalNetworkView(APIView):
    """Cached global narrator network for the D3 force graph."""

    def get(self, request):
        payload = cache.get(GRAPH_CACHE_KEY)
        if payload is None:
            # Build on demand if Celery hasn't populated it yet.
            payload = graph_engine._to_flow_payload(graph_engine.build_narrator_graph())
        limit = int(request.query_params.get("limit", 500))
        return Response(
            {"nodes": payload["nodes"][:limit], "edges": payload["edges"]}
        )
