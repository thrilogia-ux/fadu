import type { HomeCategory, HomeProductPlain } from "@/lib/home-data";
import { getInternalApiOrigin } from "@/lib/internal-api-origin";

const FETCH_MS = 15_000;

function toPlainFromApiJson(p: unknown): HomeProductPlain | null {
  if (!p || typeof p !== "object") return null;
  const o = p as Record<string, unknown>;
  const cat = o.category as { name?: string; slug?: string } | undefined;
  const rawImages = Array.isArray(o.images) ? o.images : [];
  const images = rawImages
    .map((img) => ({ url: String((img as { url?: string }).url ?? "") }))
    .filter((i) => i.url.length > 0);
  return {
    id: String(o.id),
    name: String(o.name),
    slug: String(o.slug),
    price: Number(o.price),
    compareAtPrice:
      o.compareAtPrice != null && o.compareAtPrice !== "" ? Number(o.compareAtPrice) : null,
    images,
    category:
      cat?.name && cat?.slug
        ? { name: cat.name, slug: cat.slug }
        : { name: "Productos", slug: "productos" },
  };
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

/** Si Prisma en RSC falla, otra invocación HTTP a veces obtiene datos igual. */
export async function loadFeaturedFromApi(): Promise<HomeProductPlain[]> {
  try {
    const base = getInternalApiOrigin();
    const data = await safeJsonFetch(`${base}/api/products?limit=8&featured=true`);
    if (!Array.isArray(data)) return [];
    return data.map(toPlainFromApiJson).filter((x): x is HomeProductPlain => x != null);
  } catch (e) {
    console.error("[home-api-fallback] featured:", e);
    return [];
  }
}

export async function loadOffersFromApi(): Promise<HomeProductPlain[]> {
  try {
    const base = getInternalApiOrigin();
    const data = await safeJsonFetch(`${base}/api/products?limit=8&onSale=true`);
    if (!Array.isArray(data)) return [];
    return data.map(toPlainFromApiJson).filter((x): x is HomeProductPlain => x != null);
  } catch (e) {
    console.error("[home-api-fallback] offers:", e);
    return [];
  }
}

export async function loadCategoriesFromApi(): Promise<HomeCategory[]> {
  try {
    const base = getInternalApiOrigin();
    const data = await safeJsonFetch(`${base}/api/categories`);
    if (!Array.isArray(data)) return [];
    return data
      .map((c: unknown) => {
        if (!c || typeof c !== "object") return null;
        const o = c as Record<string, unknown>;
        if (typeof o.id !== "string" || typeof o.name !== "string" || typeof o.slug !== "string")
          return null;
        return { id: o.id, name: o.name, slug: o.slug };
      })
      .filter((x): x is HomeCategory => x != null);
  } catch (e) {
    console.error("[home-api-fallback] categories:", e);
    return [];
  }
}
