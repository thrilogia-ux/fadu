import type { HomeCategory, HomeProductPlain } from "@/lib/home-data";
import { getInternalApiOrigin } from "@/lib/internal-api-origin";
import { normalizeApiProductList } from "@/lib/normalize-api-product";

const FETCH_MS = 15_000;

async function apiOriginCandidates(): Promise<string[]> {
  let requestOrigin: string | null = null;
  try {
    const { getRequestOrigin } = await import("@/lib/request-origin");
    requestOrigin = await getRequestOrigin();
  } catch {
    /* headers() no disponible en este contexto */
  }
  const internal = getInternalApiOrigin();
  const set = new Set<string>();
  if (requestOrigin) set.add(requestOrigin.replace(/\/$/, ""));
  if (internal) set.add(internal.replace(/\/$/, ""));
  return Array.from(set);
}

async function safeJsonFetch(url: string): Promise<unknown> {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_MS),
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchProductsWithBases(pathAndQuery: string): Promise<HomeProductPlain[]> {
  for (const base of await apiOriginCandidates()) {
    try {
      const data = await safeJsonFetch(`${base}${pathAndQuery}`);
      const list = normalizeApiProductList(data, 8);
      if (list.length > 0) return list;
    } catch (e) {
      console.error("[home-api-fallback]", pathAndQuery, base, e);
    }
  }
  return [];
}

async function fetchCategoriesWithBases(): Promise<HomeCategory[]> {
  for (const base of await apiOriginCandidates()) {
    try {
      const data = await safeJsonFetch(`${base}/api/categories`);
      if (!Array.isArray(data)) continue;
      const list = data
        .map((c: unknown) => {
          if (!c || typeof c !== "object") return null;
          const o = c as Record<string, unknown>;
          if (typeof o.id !== "string" || typeof o.name !== "string" || typeof o.slug !== "string")
            return null;
          return { id: o.id, name: o.name, slug: o.slug };
        })
        .filter((x): x is HomeCategory => x != null);
      if (list.length > 0) return list;
    } catch (e) {
      console.error("[home-api-fallback] categories", base, e);
    }
  }
  return [];
}

export async function loadFeaturedFromApi(): Promise<HomeProductPlain[]> {
  return fetchProductsWithBases("/api/products?limit=8&featured=true");
}

export async function loadOffersFromApi(): Promise<HomeProductPlain[]> {
  return fetchProductsWithBases("/api/products?limit=8&onSale=true");
}

export async function loadCategoriesFromApi(): Promise<HomeCategory[]> {
  return fetchCategoriesWithBases();
}
