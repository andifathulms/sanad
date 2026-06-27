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

const GENERATION_LABELS: Record<string, string> = {
  sahabi: "Sahabi",
  tabii: "Tabi'i",
  taba_tabii: "Tabi' al-Tabi'in",
  later: "Later",
  collector: "Collector",
  unknown: "Unknown generation",
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Force-directed global narrator network on <canvas> (scales to hundreds of
 * nodes). Scroll to zoom, drag to pan, hover for a node tooltip; Latin names
 * appear once zoomed in. Click a node to open its profile.
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
  const tooltipRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // View transform (graph → screen): screen = graph * scale + (tx, ty).
    let scale = 1;
    let tx = 0;
    let ty = 0;

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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.translate(tx, ty);
      ctx.scale(scale, scale);

      ctx.strokeStyle = "rgba(226, 185, 111, 0.12)";
      ctx.lineWidth = 1 / scale;
      for (const l of simLinks) {
        ctx.beginPath();
        ctx.moveTo(l.source.x ?? 0, l.source.y ?? 0);
        ctx.lineTo(l.target.x ?? 0, l.target.y ?? 0);
        ctx.stroke();
      }

      for (const n of simNodes) {
        ctx.beginPath();
        ctx.arc(n.x ?? 0, n.y ?? 0, radius(n), 0, 2 * Math.PI);
        ctx.fillStyle = n.color;
        ctx.fill();
      }

      // Reveal Latin labels when zoomed in enough to be legible.
      if (scale >= 1.8) {
        ctx.fillStyle = "rgba(248,244,238,0.8)";
        ctx.font = `${11 / scale}px Inter, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        for (const n of simNodes) {
          const name = n.label_latin || n.label;
          if (name) ctx.fillText(name, (n.x ?? 0) + radius(n) + 2 / scale, n.y ?? 0);
        }
      }
    }

    sim.on("tick", draw);

    const toGraph = (mx: number, my: number) => ({
      gx: (mx - tx) / scale,
      gy: (my - ty) / scale,
    });

    function nodeAt(mx: number, my: number): NetworkNode | null {
      const { gx, gy } = toGraph(mx, my);
      for (const n of simNodes) {
        const dx = (n.x ?? 0) - gx;
        const dy = (n.y ?? 0) - gy;
        if (Math.hypot(dx, dy) <= radius(n) + 3) return n;
      }
      return null;
    }

    // --- Pan + click (drag past a threshold = pan, not a click) ---
    let panning = false;
    let moved = false;
    let last = { x: 0, y: 0 };

    function onDown(ev: MouseEvent) {
      panning = true;
      moved = false;
      last = { x: ev.clientX, y: ev.clientY };
    }
    function onUp(ev: MouseEvent) {
      panning = false;
      if (!moved) {
        const rect = canvas!.getBoundingClientRect();
        const hit = nodeAt(ev.clientX - rect.left, ev.clientY - rect.top);
        if (hit) router.push(`/narrator/${hit.id}`);
      }
    }

    function showTooltip(n: NetworkNode, mx: number, my: number) {
      if (!tooltip) return;
      const gen = GENERATION_LABELS[n.generation] ?? n.generation;
      tooltip.innerHTML = `
        <div style="font-weight:600">${n.label_latin || n.label || "Unknown"}</div>
        ${n.label_latin && n.label ? `<div style="font-family:Amiri,serif;font-size:15px;color:#E2B96F">${n.label}</div>` : ""}
        <div style="color:rgba(248,244,238,0.55);margin-top:2px">${gen} · ${n.reliability}</div>
        <div style="color:rgba(248,244,238,0.55)">${n.hadiths.toLocaleString()} hadiths</div>`;
      tooltip.style.display = "block";
      tooltip.style.left = `${mx + 12}px`;
      tooltip.style.top = `${my + 12}px`;
    }
    function hideTooltip() {
      if (tooltip) tooltip.style.display = "none";
    }

    function onMove(ev: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      const my = ev.clientY - rect.top;

      if (panning) {
        const dx = ev.clientX - last.x;
        const dy = ev.clientY - last.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
        tx += dx;
        ty += dy;
        last = { x: ev.clientX, y: ev.clientY };
        hideTooltip();
        draw();
        return;
      }

      const hit = nodeAt(mx, my);
      canvas!.style.cursor = hit ? "pointer" : "grab";
      if (hit) showTooltip(hit, mx, my);
      else hideTooltip();
    }

    function onWheel(ev: WheelEvent) {
      ev.preventDefault();
      const rect = canvas!.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      const my = ev.clientY - rect.top;
      const factor = ev.deltaY < 0 ? 1.1 : 1 / 1.1;
      const newScale = clamp(scale * factor, 0.3, 8);
      // Keep the point under the cursor fixed while zooming.
      tx = mx - ((mx - tx) * newScale) / scale;
      ty = my - ((my - ty) * newScale) / scale;
      scale = newScale;
      hideTooltip();
      draw();
    }

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", hideTooltip);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      sim.stop();
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", hideTooltip);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [nodes, edges, height, router]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height }}
        className="rounded-xl border border-white/10 bg-indigo-navy"
      />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-10 hidden max-w-[220px] rounded-lg border border-white/10 bg-indigo-deep/95 px-3 py-2 text-xs text-ivory shadow-lg"
      />
      <p className="mt-2 text-xs text-ivory/40">
        Scroll to zoom · drag to pan · hover a node for details · click to open the profile
      </p>
    </div>
  );
}
