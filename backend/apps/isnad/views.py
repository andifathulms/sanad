from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.hadith.models import Hadith

from . import graph as graph_engine
from .graph import RELIABILITY_COLORS
from .models import HadithNarrator, Narrator, NarratorLink
from .serializers import (
    ChainNarratorSerializer,
    NarratorDetailSerializer,
    NarratorListSerializer,
)


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
        # Surface the most prominent narrators first so high-signal names rank above
        # rare/noisy single-appearance extractions.
        return qs.order_by("-total_hadiths", "-centrality_score")


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
    """Top-N narrator network for the D3 force graph.

    Returns the most central narrators (optionally filtered) plus the edges that run
    *between* them, so the client renders a connected, bounded subgraph rather than an
    arbitrary slice. Never returns the full 27k-node graph (CLAUDE.md graph-size rule).
    """

    def get(self, request):
        params = request.query_params
        limit = min(int(params.get("limit", 300)), 1000)

        narrators = Narrator.objects.all()
        if generation := params.get("generation"):
            narrators = narrators.filter(generation=generation)
        if reliability := params.get("reliability"):
            narrators = narrators.filter(reliability_grade=reliability)

        top = list(
            narrators.order_by("-centrality_score", "-total_hadiths")[:limit]
        )
        ids = {n.id for n in top}
        nodes = [
            {
                "id": str(n.id),
                "label": n.name_arabic,
                "label_latin": n.name_transliteration,
                "reliability": n.reliability_grade,
                "color": RELIABILITY_COLORS.get(n.reliability_grade, "#95A5A6"),
                "generation": n.generation,
                "hadiths": n.total_hadiths,
                "centrality": round(n.centrality_score, 5),
            }
            for n in top
        ]
        edges = [
            {"source": str(t), "target": str(s)}
            for t, s in NarratorLink.objects.filter(
                teacher_id__in=ids, student_id__in=ids
            ).values_list("teacher_id", "student_id")
        ]
        return Response(
            {"nodes": nodes, "edges": edges, "total_narrators": narrators.count()}
        )


class NarratorPathView(APIView):
    """Shortest chain of transmission between two narrators (heavy — builds the graph)."""

    def get(self, request):
        try:
            src = int(request.query_params["from"])
            dst = int(request.query_params["to"])
        except (KeyError, ValueError):
            return Response({"detail": "from and to narrator ids are required"}, status=400)

        path_ids = graph_engine.get_shortest_path(src, dst)
        by_id = Narrator.objects.in_bulk(path_ids)
        path = [
            {
                "id": nid,
                "name_arabic": by_id[nid].name_arabic,
                "reliability_grade": by_id[nid].reliability_grade,
            }
            for nid in path_ids
            if nid in by_id
        ]
        return Response({"path": path, "length": max(len(path) - 1, 0)})
