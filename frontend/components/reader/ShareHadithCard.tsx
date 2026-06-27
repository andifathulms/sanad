"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GRADE_COLORS, GRADE_LABELS } from "@/components/reader/GradeBadge";
import type { Grade } from "@/lib/api/types";

interface Props {
  arabic: string;
  translation: string;
  reference: string;
  grade: Grade;
  source?: string;
}

const W = 1080;
const SCALE = 2; // retina-crisp export
const MARGIN = 90;

/** Greedy word-wrap; returns the lines that fit within maxWidth. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Renders a shareable hadith card to a canvas and exports it as a PNG.
 * Drawn entirely with the Canvas 2D API (no external libs, no tainting),
 * so toBlob() download works. Arabic is shaped by the browser in-canvas.
 */
export function ShareHadithCard({ arabic, translation, reference, grade, source }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const innerW = W - MARGIN * 2;
    const arFont = "bold 46px Amiri, serif";
    const trFont = "28px Inter, sans-serif";
    const arLH = 70;
    const trLH = 42;

    // Pre-measure to size the canvas height.
    ctx.font = arFont;
    const arLines = wrap(ctx, arabic, innerW);
    ctx.font = trFont;
    const trLines = wrap(ctx, translation || "", innerW);

    const headerH = 150;
    const gap = 50;
    const footerH = 110;
    const bodyH = arLines.length * arLH + (trLines.length ? gap + trLines.length * trLH : 0);
    const H = headerH + bodyH + footerH;

    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    ctx.scale(SCALE, SCALE);

    // Background.
    ctx.fillStyle = "#1A1A2E";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#E2B96F";
    ctx.fillRect(0, 0, W, 8);

    // Header: reference + grade.
    ctx.textAlign = "left";
    ctx.direction = "ltr";
    ctx.font = "28px Inter, sans-serif";
    ctx.fillStyle = "rgba(248,244,238,0.6)";
    ctx.fillText(reference, MARGIN, 80);

    const label = GRADE_LABELS[grade];
    ctx.font = "bold 26px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillStyle = GRADE_COLORS[grade];
    ctx.fillText(label, W - MARGIN, 80);
    if (source) {
      ctx.font = "20px Inter, sans-serif";
      ctx.fillStyle = "rgba(248,244,238,0.4)";
      ctx.fillText(`According to: ${source}`, W - MARGIN, 110);
    }

    // Arabic matn (RTL, right-aligned).
    let y = headerH + 20;
    ctx.font = arFont;
    ctx.fillStyle = "#F8F4EE";
    ctx.textAlign = "right";
    ctx.direction = "rtl";
    for (const line of arLines) {
      ctx.fillText(line, W - MARGIN, y);
      y += arLH;
    }

    // Translation (LTR).
    if (trLines.length) {
      y += gap - arLH + 20;
      ctx.font = trFont;
      ctx.fillStyle = "rgba(248,244,238,0.85)";
      ctx.textAlign = "left";
      ctx.direction = "ltr";
      for (const line of trLines) {
        ctx.fillText(line, MARGIN, y);
        y += trLH;
      }
    }

    // Footer.
    ctx.font = "600 30px 'Crimson Pro', serif";
    ctx.fillStyle = "#E2B96F";
    ctx.textAlign = "left";
    ctx.fillText("سند Sanad", MARGIN, H - 45);
    ctx.font = "20px Inter, sans-serif";
    ctx.fillStyle = "rgba(248,244,238,0.4)";
    ctx.textAlign = "right";
    ctx.fillText("Every hadith has a chain.", W - MARGIN, H - 45);

    setReady(true);
  }, [arabic, translation, reference, grade, source]);

  useEffect(() => {
    // Wait for web fonts so Arabic/serif render correctly in the export.
    let active = true;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    const run = () => active && draw();
    if (fonts?.ready) fonts.ready.then(run);
    else run();
    return () => {
      active = false;
    };
  }, [draw]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reference.replace(/[:\s]/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="surface space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-crimson text-amber-node">Share as image</h3>
        <button
          onClick={download}
          disabled={!ready}
          className="rounded-lg bg-indigo-scholar px-4 py-1.5 text-sm font-medium hover:bg-indigo-scholar/80 disabled:opacity-40"
        >
          Download PNG
        </button>
      </div>
      <canvas ref={canvasRef} className="w-full rounded-lg border border-white/10" />
    </div>
  );
}
