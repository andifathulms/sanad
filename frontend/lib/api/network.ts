import { api } from "./client";

export interface NetworkNode {
  id: string;
  label: string;
  label_latin?: string;
  reliability: string;
  color: string;
  generation: string;
  hadiths: number;
  centrality: number;
  // d3-force mutates these in place
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface NetworkEdge {
  source: string;
  target: string;
}

export interface NetworkResponse {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  total_narrators: number;
}

export interface PathNarrator {
  id: number;
  name_arabic: string;
  reliability_grade: string;
}

export const getGlobalNetwork = (params: {
  limit?: number;
  generation?: string;
  reliability?: string;
}) => api<NetworkResponse>("/network/global/", { params });

export const getNarratorPath = (from: number, to: number) =>
  api<{ path: PathNarrator[]; length: number }>("/narrators/path/", {
    params: { from, to },
  });
