"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import type { SanadResponse } from "@/lib/api/types";

/**
 * Per-hadith isnad graph. Nodes flow top-to-bottom (Prophet ﷺ at top, collector at
 * bottom); node color comes from the reliability palette supplied by the backend.
 * React Flow is only used for small per-hadith chains (< ~10 nodes) — the global
 * 10k-node network uses D3/canvas instead (CLAUDE.md graph-size warning).
 */
export function IsnadGraph({ data }: { data: SanadResponse["graph_data"] }) {
  const nodes: Node[] = useMemo(
    () =>
      data.nodes.map((n, i) => {
        const ar = (n.data as any).label_ar as string | undefined;
        const latin = (n.data as any).label as string | undefined;
        return {
          id: n.id,
          position: { x: 0, y: i * 120 },
          data: {
            label: (
              <div className="leading-tight">
                {ar && <div className="text-base">{ar}</div>}
                {latin && <div className="text-xs opacity-70">{latin}</div>}
                {!ar && !latin && <div>{n.id}</div>}
              </div>
            ),
          },
          style: {
            background: String((n.data as any).color ?? "#95A5A6"),
            color: "#1A1A2E",
            border: "none",
            borderRadius: 12,
            padding: 10,
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
            width: 200,
            textAlign: "center" as const,
          },
        };
      }),
    [data.nodes],
  );

  const edges: Edge[] = useMemo(
    () =>
      data.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: true,
        style: { stroke: "#E2B96F" },
      })),
    [data.edges],
  );

  return (
    <div className="h-[80vh] w-full rounded-xl border border-white/10 bg-indigo-navy">
      <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: true }}>
        <Background color="#0F3460" gap={24} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
