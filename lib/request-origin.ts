import { headers } from "next/headers";

/**
 * URL del sitio tal como llega la petición (Host / X-Forwarded-*).
 * Evita depender solo de NEXT_PUBLIC_SITE_URL o VERCEL_URL en el server fetch interno.
 */
export async function getRequestOrigin(): Promise<string | null> {
  try {
    const h = await headers();
    const hostRaw = h.get("x-forwarded-host") ?? h.get("host");
    if (!hostRaw) return null;
    const host = hostRaw.split(",")[0].trim();
    const proto = (h.get("x-forwarded-proto") ?? "https").split(",")[0].trim();
    return `${proto}://${host}`;
  } catch {
    return null;
  }
}
