/**
 * Analiza DATABASE_URL para Vercel + Supabase (sin exponer credenciales).
 */
export type DatabaseUrlDiagnostics = {
  configured: boolean;
  usesPooler: boolean;
  hasPgbouncer: boolean;
  hasConnectionLimit: boolean;
  connectionLimit: string | null;
  sslMode: string | null;
  warnings: string[];
  /** true si pooler + pgbouncer (mínimo recomendado para serverless) */
  serverlessReady: boolean;
};

export function analyzeDatabaseUrl(url?: string): DatabaseUrlDiagnostics {
  const warnings: string[] = [];
  const raw = url?.trim();

  if (!raw) {
    return {
      configured: false,
      usesPooler: false,
      hasPgbouncer: false,
      hasConnectionLimit: false,
      connectionLimit: null,
      sslMode: null,
      warnings: ["DATABASE_URL no está configurada"],
      serverlessReady: false,
    };
  }

  try {
    const parsed = new URL(raw.replace(/^postgresql:/, "http:"));
    const port = parsed.port || "5432";
    const host = parsed.hostname.toLowerCase();
    const usesPooler = port === "6543" || host.includes("pooler");
    const hasPgbouncer = parsed.searchParams.get("pgbouncer") === "true";
    const connectionLimit = parsed.searchParams.get("connection_limit");
    const sslMode = parsed.searchParams.get("sslmode");

    if (!usesPooler) {
      warnings.push(
        "La URL parece usar conexión directa (puerto 5432). En Vercel usá el pooler de Supabase en puerto 6543."
      );
    }
    if (!hasPgbouncer) {
      warnings.push("Falta ?pgbouncer=true (necesario para Prisma con el pooler de Supabase).");
    }
    if (!connectionLimit) {
      warnings.push("Recomendado: connection_limit=1 en cada función serverless de Vercel.");
    } else if (connectionLimit !== "1") {
      warnings.push(
        `connection_limit=${connectionLimit}. Para Vercel serverless suele ser mejor connection_limit=1.`
      );
    }
    if (!sslMode) {
      warnings.push("Agregá sslmode=require para conexiones a Supabase.");
    }

    return {
      configured: true,
      usesPooler,
      hasPgbouncer,
      hasConnectionLimit: Boolean(connectionLimit),
      connectionLimit,
      sslMode,
      warnings,
      serverlessReady: usesPooler && hasPgbouncer,
    };
  } catch {
    return {
      configured: true,
      usesPooler: false,
      hasPgbouncer: false,
      hasConnectionLimit: false,
      connectionLimit: null,
      sslMode: null,
      warnings: ["DATABASE_URL tiene un formato inválido"],
      serverlessReady: false,
    };
  }
}

export const RECOMMENDED_DATABASE_URL_SUFFIX =
  "?pgbouncer=true&connection_limit=1&sslmode=require";
