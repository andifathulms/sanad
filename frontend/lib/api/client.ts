/**
 * Thin REST client for the Sanad backend.
 *
 * On the server we hit the Django service directly; in the browser we use the
 * same-origin /api proxy (configured in next.config.js) so cookies/JWT flow simply.
 */
const SERVER_BASE =
  process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8000";
const CLIENT_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api/v1";

function baseUrl(): string {
  return typeof window === "undefined" ? `${SERVER_BASE}/api/v1` : CLIENT_BASE;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  init?: RequestInit & { params?: Record<string, string | number | undefined> },
): Promise<T> {
  const url = new URL(`${baseUrl()}${path}`, "http://placeholder");
  // When baseUrl is relative ("/api/v1") URL needs an origin; strip it back out.
  const isAbsolute = baseUrl().startsWith("http");
  if (init?.params) {
    for (const [k, v] of Object.entries(init.params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const finalUrl = isAbsolute ? url.toString() : `${url.pathname}${url.search}`;

  const res = await fetch(finalUrl, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    // corpus is static — let Next cache GETs for an hour
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText} for ${path}`);
  }
  return res.json() as Promise<T>;
}
