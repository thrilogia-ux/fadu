/**
 * Origen para llamadas server→server al propio deploy (fallback del home).
 * En Vercel definí NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app para el entorno Production.
 */
export function getInternalApiOrigin(): string {
  const publicUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (publicUrl) return publicUrl;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
