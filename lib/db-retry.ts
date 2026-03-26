/**
 * Reintentos para consultas Prisma desde serverless (Vercel ↔ Supabase).
 * Un fallo puntual no debe vaciar todo el home.
 */
const DELAYS_MS = [100, 250, 500, 1000, 2000];

export async function runWithDbRetries<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  let last: unknown;
  for (let i = 0; i < DELAYS_MS.length; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i < DELAYS_MS.length - 1) {
        await new Promise((r) => setTimeout(r, DELAYS_MS[i]));
      }
    }
  }
  console.error(`[db-retry] ${label} falló tras ${DELAYS_MS.length} intentos`, last);
  return null;
}
