/**
 * Reintentos para consultas Prisma desde serverless (Vercel ↔ Supabase).
 * Solo reintenta errores de conexión / pool, no errores de negocio.
 */
const DELAYS_MS = [100, 250, 500, 1000, 2000];

const RETRYABLE_PRISMA_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database server timed out
  "P1008", // Operations timed out
  "P1017", // Server closed connection
  "P2024", // Timed out fetching connection from pool
]);

export function isRetryableDbError(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code: unknown }).code);
    if (RETRYABLE_PRISMA_CODES.has(code)) return true;
  }
  const msg = error instanceof Error ? error.message : String(error);
  return /connect|connection|timeout|ECONNRESET|ETIMEDOUT|Can't reach database|closed the connection/i.test(
    msg
  );
}

export type DbRetryResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "db_error"; error: unknown };

export async function runWithDbRetries<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  const result = await runWithDbRetriesResult(label, fn);
  if (!result.ok) return null;
  return result.data;
}

export async function runWithDbRetriesResult<T>(
  label: string,
  fn: () => Promise<T>
): Promise<DbRetryResult<T>> {
  let last: unknown;

  for (let i = 0; i < DELAYS_MS.length; i++) {
    try {
      const data = await fn();
      return { ok: true, data };
    } catch (e) {
      last = e;
      if (!isRetryableDbError(e)) {
        console.error(`[db-retry] ${label} error no reintentable`, e);
        return { ok: false, reason: "db_error", error: e };
      }
      if (i < DELAYS_MS.length - 1) {
        await new Promise((r) => setTimeout(r, DELAYS_MS[i]));
      }
    }
  }

  console.error(`[db-retry] ${label} falló tras ${DELAYS_MS.length} intentos`, last);
  return { ok: false, reason: "db_error", error: last };
}
