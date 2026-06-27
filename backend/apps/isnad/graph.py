"""NetworkX-backed narrator graph analysis.

All heavy computation here runs inside Celery workers (queue: 'graph'),
never at request time. Results are cached in Redis / written back to model fields.
"""
from __future__ import annotations

import networkx as nx

from apps.isnad.models import HadithNarrator, Narrator, NarratorLink

# Mirror of the frontend RELIABILITY_COLORS (lib/grading.ts) so the API can ship
# colors directly. Semantics: green=reliable, teal=truthful, amber=weak,
# purple=abandoned, slate=unassessed.
RELIABILITY_COLORS = {
    "thiqah": "#27AE60",
    "saduq": "#2D9C8F",
    "daif": "#E08A2E",
    "majhul": "#7F8C8D",
    "matruk": "#8E44AD",
    "unknown": "#95A5A6",
}


def build_narrator_graph() -> nx.DiGraph:
    """Build the directed graph where each edge is (teacher -> student)."""
    graph = nx.DiGraph()
    for narrator in Narrator.objects.all().only(
        "id", "name_transliteration", "reliability_grade", "generation"
    ):
        graph.add_node(
            narrator.id,
            label=narrator.name_transliteration,
            reliability=narrator.reliability_grade,
            generation=narrator.generation,
        )
    for link in NarratorLink.objects.all().values_list("teacher_id", "student_id", "hadith_count"):
        teacher_id, student_id, weight = link
        graph.add_edge(teacher_id, student_id, weight=weight)
    return graph


def get_shortest_path(narrator1_id: int, narrator2_id: int) -> list[int]:
    """Shortest narrator path between two narrators (undirected reachability)."""
    graph = build_narrator_graph().to_undirected()
    try:
        return nx.shortest_path(graph, source=narrator1_id, target=narrator2_id)
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return []


def get_narrator_subgraph(narrator_id: int, depth: int = 2) -> dict:
    """Return the ego graph (narrator + N-hop neighbours) for React Flow."""
    graph = build_narrator_graph()
    if narrator_id not in graph:
        return {"nodes": [], "edges": []}
    ego = nx.ego_graph(graph.to_undirected(), narrator_id, radius=depth)
    return _to_flow_payload(graph.subgraph(ego.nodes))


# Above this node count, exact betweenness (O(V·E)) is impractical — sample instead.
_BETWEENNESS_EXACT_MAX = 2000
_BETWEENNESS_SAMPLE_K = 600


def compute_centrality() -> dict[int, float]:
    """Betweenness centrality for all narrators (heavy — Celery only).

    For large corpora we approximate with k pivot nodes; exact computation on tens of
    thousands of narrators would take hours. The ranking it produces is stable enough
    to surface hub narrators.
    """
    graph = build_narrator_graph()
    n = graph.number_of_nodes()
    if n == 0:
        return {}
    if n <= _BETWEENNESS_EXACT_MAX:
        return nx.betweenness_centrality(graph, weight="weight")
    k = min(_BETWEENNESS_SAMPLE_K, n)
    # seed is fixed (no Math.random equivalent needed) for reproducibility
    return nx.betweenness_centrality(graph, k=k, weight="weight", seed=42)


def get_hadith_chain_graph(hadith_id: int) -> dict:
    """Return a single hadith's sanad as a React-Flow node/edge structure."""
    rows = (
        HadithNarrator.objects.filter(hadith_id=hadith_id)
        .select_related("narrator")
        .order_by("position")
    )
    nodes, edges = [], []
    prev_id = None
    for row in rows:
        narrator = row.narrator
        nodes.append(
            {
                "id": str(narrator.id),
                "data": {
                    "label": narrator.name_transliteration,
                    "label_ar": narrator.name_arabic,
                    "reliability": narrator.reliability_grade,
                    "color": RELIABILITY_COLORS.get(narrator.reliability_grade, "#95A5A6"),
                    "position": row.position,
                },
            }
        )
        if prev_id is not None:
            edges.append(
                {
                    "id": f"e{prev_id}-{narrator.id}",
                    "source": str(prev_id),
                    "target": str(narrator.id),
                }
            )
        prev_id = narrator.id
    return {"nodes": nodes, "edges": edges}


def _to_flow_payload(graph: nx.Graph) -> dict:
    nodes = [
        {
            "id": str(node_id),
            "data": {
                "label": attrs.get("label", str(node_id)),
                "reliability": attrs.get("reliability", "unknown"),
                "color": RELIABILITY_COLORS.get(attrs.get("reliability", "unknown"), "#95A5A6"),
            },
        }
        for node_id, attrs in graph.nodes(data=True)
    ]
    edges = [
        {"id": f"e{u}-{v}", "source": str(u), "target": str(v)}
        for u, v in graph.edges()
    ]
    return {"nodes": nodes, "edges": edges}
