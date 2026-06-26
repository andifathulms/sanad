"use client";

import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
} from "d3-force";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { NetworkEdge, NetworkNode } from "@/lib/api/network";

/**
 * Force-directed global narrator network, rendered to <canvas> (not React Flow) so it
 * scales to hundreds of nodes — CLAUDE.md reserves React Flow for small per-hadith
 * chains and mandates canvas for the global view. Node radius scales with appearances,
 * color encodes reliability. Click a node to open its profile.
 */
export function GlobalNetwork({
  nodes,
  edges,
  height = 600,
}: {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context; // non-null binding preserved inside the draw/click closures

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Work on copies so d3's mutations don't leak into React state.
    const simNodes: NetworkNode[] = nodes.map((n) => ({ ...n }));
    const byId = new Map(simNodes.map((n) => [n.id, n]));
    type SimLink = { source: NetworkNode; target: NetworkNode };
    const simLinks = edges
      .map((e) => ({ source: byId.get(e.source), target: byId.get(e.target) }))
      .filter((l) => l.source && l.target) as SimLink[];

    const radius = (n: NetworkNode) => 3 + Math.sqrt(n.hadiths || 1) * 0.6;

    const sim: Simulation<NetworkNode, SimLink> = forceSimulation(simNodes)
      .force(
        "link",
        forceLink<NetworkNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(40)
          .strength(0.2),
      )
      .force("charge", forceManyBody().strength(-60))
      .force("center", forceCenter(width / 2, height / 2))
      .alphaDecay(0.05);

    function draw() {
      ctx.clearRect(0, 0, width, height);
      // edges
      ctx.strokeStyle = "rgba(226, 185, 111, 0.12)";
      ctx.lineWidth = 1;
      for (const l of simLinks) {
        ctx.beginPath();
        ctx.moveTo(l.source.x ?? 0, l.source.y ?? 0);
        ctx.lineTo(l.target.x ?? 0, l.target.y ?? 0);
        ctx.stroke();
      }
      // nodes
      for (const n of simNodes) {
        ctx.beginPath();
        ctx.arc(n.x ?? 0, n.y ?? 0, radius(n), 0, 2 * Math.PI);
        ctx.fillStyle = n.color;
        ctx.fill();
      }
    }

    sim.on("tick", draw);

    // Click → nearest node within its radius opens the profile.
    function onClick(ev: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      const my = ev.clientY - rect.top;
      let hit: NetworkNode | null = null;
      for (const n of simNodes) {
        const dx = (n.x ?? 0) - mx;
        const dy = (n.y ?? 0) - my;
        if (Math.hypot(dx, dy) <= radius(n) + 2) {
          hit = n;
          break;
        }
      }
      if (hit) router.push(`/narrator/${hit.id}`);
    }
    canvas.addEventListener("click", onClick);

    return () => {
      sim.stop();
      canvas.removeEventListener("click", onClick);
    };
  }, [nodes, edges, height, router]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height }}
      className="cursor-pointer rounded-xl border border-white/10 bg-indigo-navy"
    />
  );
}
