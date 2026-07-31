/**
 * Normaliza DATABASE_URL para Vercel + Supabase (sin exponer credenciales).
 */
export type DatabasePoolMode = "transaction" | "session" | "direct" | "unknown";

export type DatabaseUrlDiagnostics = {
  configured: boolean;
  usesPooler: boolean;
  poolMode: DatabasePoolMode;
  hasPgbouncer: boolean;
  hasConnectionLimit: boolean;
  connectionLimit: string | null;
  sslMode: string | null;
  warnings: string[];
  /** true si transaction pooler + pgbouncer + connection_limit=1 */
  serverlessReady: boolean;
};

function parseDatabaseUrl(raw: string): URL {
  return new URL(raw.replace(/^postgresql:/, "http:"));
}

function isSupabasePoolerHost(host: string): boolean {
  return host.includes("pooler.supabase.com") || host.includes(".pooler.");
}

function rebuildPostgresUrl(parsed: URL): string {
  const username = parsed.username ? decodeURIComponent(parsed.username) : "";
  const password = parsed.password ? decodeURIComponent(parsed.password) : "";
  const auth =
    username.length > 0
      ? `${encodeURIComponent(username)}${password ? `:${encodeURIComponent(password)}` : ""}@`
      : "";
  const portPart = parsed.port ? `:${parsed.port}` : "";
  const search = parsed.searchParams.toString();
  return `postgresql://${auth}${parsed.hostname}${portPart}${parsed.pathname}${search ? `?${search}` : ""}`;
}

/**
 * Ajusta la URL para serverless: transaction pool (6543), pgbouncer, connection_limit=1.
 * Corrige el error EMAXCONNSESSION (session mode, pool_size 15).
 */
export function normalizeServerlessDatabaseUrl(raw?: string): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = parseDatabaseUrl(trimmed);
    const host = parsed.hostname.toLowerCase();
    const pooler = isSupabasePoolerHost(host);
    let port = parsed.port || "5432";

    if (pooler && port === "5432") {
      parsed.port = "6543";
      port = "6543";
    }

    if (pooler || port === "6543") {
      parsed.searchParams.set("pgbouncer", "true");
      if (!parsed.searchParams.get("connection_limit")) {
        parsed.searchParams.set("connection_limit", "1");
      }
    }

    if (!parsed.searchParams.get("sslmode")) {
      parsed.searchParams.set("sslmode", "require");
    }

    return rebuildPostgresUrl(parsed);
  } catch {
    return trimmed;
  }
}

export function getPrismaDatabaseUrl(): string | undefined {
  return normalizeServerlessDatabaseUrl(process.env.DATABASE_URL);
}

export function analyzeDatabaseUrl(url?: string): DatabaseUrlDiagnostics {
  const warnings: string[] = [];
  const raw = url?.trim();

  if (!raw) {
    return {
      configured: false,
      usesPooler: false,
      poolMode: "unknown",
      hasPgbouncer: false,
      hasConnectionLimit: false,
      connectionLimit: null,
      sslMode: null,
      warnings: ["DATABASE_URL no está configurada"],
      serverlessReady: false,
    };
  }

  try {
    const parsed = parseDatabaseUrl(raw);
    const port = parsed.port || "5432";
    const host = parsed.hostname.toLowerCase();
    const pooler = isSupabasePoolerHost(host) || port === "6543";
    const hasPgbouncer = parsed.searchParams.get("pgbouncer") === "true";
    const connectionLimit = parsed.searchParams.get("connection_limit");
    const sslMode = parsed.searchParams.get("sslmode");

    let poolMode: DatabasePoolMode = "direct";
    if (pooler && port === "6543") poolMode = "transaction";
    else if (pooler && port === "5432") poolMode = "session";

    if (poolMode === "session") {
      warnings.push(
        "Estás en SESSION mode (puerto 5432 del pooler). En Vercel causa EMAXCONNSESSION. Usá TRANSACTION mode (puerto 6543) con pgbouncer=true."
      );
    }
    if (!pooler && port === "5432") {
      warnings.push(
        "Conexión directa a Postgres. En Vercel usá el pooler Supabase en puerto 6543 (Transaction)."
      );
    }
    if (pooler && !hasPgbouncer) {
      warnings.push("Falta ?pgbouncer=true (requerido por Prisma con el pooler de Supabase).");
    }
    if (!connectionLimit) {
      warnings.push("Falta connection_limit=1 (cada función serverless debe usar una sola conexión).");
    } else if (connectionLimit !== "1") {
      warnings.push(`connection_limit=${connectionLimit}. Para Vercel conviene connection_limit=1.`);
    }
    if (!sslMode) {
      warnings.push("Agregá sslmode=require.");
    }

    const serverlessReady =
      poolMode === "transaction" && hasPgbouncer && connectionLimit === "1";

    return {
      configured: true,
      usesPooler: pooler,
      poolMode,
      hasPgbouncer,
      hasConnectionLimit: Boolean(connectionLimit),
      connectionLimit,
      sslMode,
      warnings,
      serverlessReady,
    };
  } catch {
    return {
      configured: true,
      usesPooler: false,
      poolMode: "unknown",
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

export function isMaxConnectionsSessionError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return msg.includes("emaxconnsession") || msg.includes("max clients reached");
}
