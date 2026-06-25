"""Celery tasks for narrator graph computation (queue: 'graph')."""
from celery import shared_task
from django.core.cache import cache

from apps.isnad import graph as graph_engine
from apps.isnad.models import Narrator

GRAPH_CACHE_KEY = "isnad:global_graph_payload"


@shared_task(name="apps.isnad.tasks.build_narrator_graph")
def build_narrator_graph():
    """Build the global narrator graph and cache the React/D3 payload."""
    graph = graph_engine.build_narrator_graph()
    payload = graph_engine._to_flow_payload(graph)
    cache.set(GRAPH_CACHE_KEY, payload, timeout=None)
    return {"nodes": len(payload["nodes"]), "edges": len(payload["edges"])}


@shared_task(name="apps.isnad.tasks.compute_centrality")
def compute_centrality():
    """Compute betweenness centrality and persist it onto each Narrator."""
    scores = graph_engine.compute_centrality()
    updated = []
    for narrator in Narrator.objects.all().only("id", "centrality_score"):
        narrator.centrality_score = scores.get(narrator.id, 0.0)
        updated.append(narrator)
    Narrator.objects.bulk_update(updated, ["centrality_score"], batch_size=500)
    return {"narrators_scored": len(updated)}
