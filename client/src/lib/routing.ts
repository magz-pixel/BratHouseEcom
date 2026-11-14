/**
 * Routing helpers. The real deployment uses normal paths (/build?…).
 * The static demo build sets VITE_HASH_ROUTER=1 so it works on any static host
 * without server rewrites (#/build, query kept in location.search).
 */
export const HASH_ROUTER = import.meta.env.VITE_HASH_ROUTER === "1";

export function currentQuery(): string {
  if (typeof window === "undefined") return "";
  return window.location.search.replace(/^\?/, "");
}

/** Absolute, shareable URL for an app path + query. */
export function absoluteUrl(path: string, query = ""): string {
  const { origin, pathname } = window.location;
  const qs = query ? `?${query}` : "";
  return HASH_ROUTER ? `${origin}${pathname}${qs}#${path}` : `${origin}${path}${qs}`;
}

/** Update the address bar without a navigation (keeps the builder state shareable). */
export function replaceQuery(path: string, query: string) {
  const qs = query ? `?${query}` : "";
  const next = HASH_ROUTER ? `${window.location.pathname}${qs}#${path}` : `${path}${qs}`;
  try { window.history.replaceState(window.history.state, "", next); } catch { /* sandboxed frames */ }
}

/** In-app href that carries a query string (works for both routers). */
export const pathWithQuery = (path: string, query: string) => (query ? `${path}?${query}` : path);

/** Public asset URL that works under any base path. */
export const asset = (file: string) => `${import.meta.env.BASE_URL}${file.replace(/^\//, "")}`;
