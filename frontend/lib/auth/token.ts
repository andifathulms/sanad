/** Minimal JWT storage. Tokens live in localStorage; SSR-safe guards included. */
const ACCESS = "sanad.access";
const REFRESH = "sanad.refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS);
}

export function setTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS, access);
  if (refresh) window.localStorage.setItem(REFRESH, refresh);
  window.dispatchEvent(new Event("sanad-auth"));
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS);
  window.localStorage.removeItem(REFRESH);
  window.dispatchEvent(new Event("sanad-auth"));
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
