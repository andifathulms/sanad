"use client";

import {
  forceCenter,
  forceCollide,
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
 * Force-directed global narrator network on <canvas>. Scroll to zoom, drag to pan,
 * hover for a tooltip. CLICK a node to focus its ego network — its direct
 * teacher/student links light up and everything else fades — and open a side panel
 * with the narrator's details and a link to their full profile.
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
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    const panel = panelRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    let scale = 1;
    let tx = 0;
    let ty = 0;

    const simNodes: NetworkNode[] = nodes.map((n) => ({ ...n }));
    const byId = new Map(simNodes.map((n) => [n.id, n]));
    type SimLink = { source: NetworkNode; target: NetworkNode };
    const simLinks = edges
      .map((e) => ({ source: byId.get(e.source), target: byId.get(e.target) }))
      .filter((l) => l.source && l.target) as SimLink[];

    // Adjacency for ego-network highlighting.
    const adjacency = new Map<string, Set<string>>();
    for (const l of simLinks) {
      (adjacency.get(l.source.id) ?? adjacency.set(l.source.id, new Set()).get(l.source.id)!).add(
        l.target.id,
      );
      (adjacency.get(l.target.id) ?? adjacency.set(l.target.id, new Set()).get(l.target.id)!).add(
        l.source.id,
      );
    }

    let selected: NetworkNode | null = null;
    let neighborIds = new Set<string>();

    const radius = (n: NetworkNode) => clamp(2.5 + Math.sqrt(n.hadiths || 1) * 0.5, 3, 22);

    const sim: Simulation<NetworkNode, SimLink> = forceSimulation(simNodes)
      .force(
        "link",
        forceLink<NetworkNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(60)
          .strength(0.15),
      )
      .force("charge", forceManyBody().strength(-120))
      .force("collide", forceCollide<NetworkNode>().radius((n) => radius(n) + 4).iterations(2))
      .force("center", forceCenter(width / 2, height / 2))
      .alphaDecay(0.04);

    const isFocused = (id: string) => !selected || id === selected.id || neighborIds.has(id);

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.translate(tx, ty);
      ctx.scale(scale, scale);

      // Edges — incident-to-selected ones light up; others fade when a node is focused.
      for (const l of simLinks) {
        const incident = selected && (l.source.id === selected.id || l.target.id === selected.id);
        ctx.strokeStyle = selected
          ? incident
            ? "rgba(226, 185, 111, 0.55)"
            : "rgba(226, 185, 111, 0.03)"
          : "rgba(226, 185, 111, 0.12)";
        ctx.lineWidth = (incident ? 1.6 : 1) / scale;
        ctx.beginPath();
        ctx.moveTo(l.source.x ?? 0, l.source.y ?? 0);
        ctx.lineTo(l.target.x ?? 0, l.target.y ?? 0);
        ctx.stroke();
      }

      for (const n of simNodes) {
        const focused = isFocused(n.id);
        ctx.globalAlpha = focused ? 1 : 0.12;
        ctx.beginPath();
        ctx.arc(n.x ?? 0, n.y ?? 0, radius(n), 0, 2 * Math.PI);
        ctx.fillStyle = n.color;
        ctx.fill();
        if (selected && n.id === selected.id) {
          ctx.lineWidth = 2.5 / scale;
          ctx.strokeStyle = "#E2B96F";
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // Labels: the focused set when a node is selected, else the zoom-gated set.
      ctx.font = `${11 / scale}px Inter, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 3 / scale;
      ctx.strokeStyle = "rgba(26,26,46,0.85)";
      for (const n of simNodes) {
        const r = radius(n);
        const show = selected ? isFocused(n.id) : scale * r >= 22;
        if (!show) continue;
        const name = n.label_latin || n.label;
        if (!name) continue;
        const lx = (n.x ?? 0) + r + 2 / scale;
        const ly = n.y ?? 0;
        ctx.strokeText(name, lx, ly);
        ctx.fillStyle = "rgba(248,244,238,0.9)";
        ctx.fillText(name, lx, ly);
      }
    }

    sim.on("tick", draw);

    const toGraph = (mx: number, my: number) => ({ gx: (mx - tx) / scale, gy: (my - ty) / scale });

    function nodeAt(mx: number, my: number): NetworkNode | null {
      const { gx, gy } = toGraph(mx, my);
      for (const n of simNodes) {
        const dx = (n.x ?? 0) - gx;
        const dy = (n.y ?? 0) - gy;
        if (Math.hypot(dx, dy) <= radius(n) + 3) return n;
      }
      return null;
    }

    function renderPanel() {
      if (!panel) return;
      if (!selected) {
        panel.style.display = "none";
        return;
      }
      const gen = GENERATION_LABELS[selected.generation] ?? selected.generation;
      panel.style.display = "block";
      panel.innerHTML = `
        <div style="font-weight:600">${selected.label_latin || selected.label || "Unknown"}</div>
        ${selected.label_latin && selected.label ? `<div style="font-family:Amiri,serif;font-size:16px;color:#E2B96F">${selected.label}</div>` : ""}
        <div style="color:rgba(248,244,238,0.55);margin-top:4px">${gen} · ${selected.reliability}</div>
        <div style="color:rgba(248,244,238,0.55)">${selected.hadiths.toLocaleString()} hadiths · ${neighborIds.size} connection(s)</div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button data-act="open" style="flex:1;border-radius:8px;background:#0F3460;color:#F8F4EE;padding:6px 10px;font-size:12px">Open profile →</button>
          <button data-act="clear" style="border-radius:8px;border:1px solid rgba(255,255,255,0.15);color:rgba(248,244,238,0.7);padding:6px 10px;font-size:12px">Clear</button>
        </div>`;
      panel.querySelector<HTMLButtonElement>('[data-act="open"]')?.addEventListener("click", () => {
        if (selected) router.push(`/narrator/${selected.id}`);
      });
      panel
        .querySelector<HTMLButtonElement>('[data-act="clear"]')
        ?.addEventListener("click", () => clearSelection());
    }

    function selectNode(n: NetworkNode) {
      selected = n;
      neighborIds = adjacency.get(n.id) ?? new Set();
      hideTooltip();
      renderPanel();
      draw();
    }
    function clearSelection() {
      selected = null;
      neighborIds = new Set();
      renderPanel();
      draw();
    }

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
      if (moved) return;
      const rect = canvas!.getBoundingClientRect();
      const hit = nodeAt(ev.clientX - rect.left, ev.clientY - rect.top);
      if (hit) selectNode(hit);
      else clearSelection();
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
      <div
        ref={panelRef}
        className="absolute right-3 top-3 z-20 hidden w-56 rounded-xl border border-white/10 bg-indigo-deep/95 p-4 text-xs text-ivory shadow-xl"
      />
      <p className="mt-2 text-xs text-ivory/40">
        Scroll to zoom · drag to pan · hover for details · click a node to focus its connections
      </p>
    </div>
  );
}
