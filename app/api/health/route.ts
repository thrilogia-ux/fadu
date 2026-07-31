import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeDatabaseUrl } from "@/lib/database-url";

export const dynamic = "force-dynamic";

/** Comprueba API, PostgreSQL y configuración recomendada Vercel + Supabase. */
export async function GET() {
  const dbConfig = analyzeDatabaseUrl(process.env.DATABASE_URL);
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());

  let database: "ok" | "error" = "error";
  let databaseLatencyMs: number | null = null;
  let databaseError: string | undefined;

  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
    databaseLatencyMs = Date.now() - started;
  } catch (e) {
    databaseLatencyMs = Date.now() - started;
    databaseError = e instanceof Error ? e.message : String(e);
    console.error("[health] falló conexión a la base:", e);
  }

  const configWarnings = dbConfig.warnings;
  const hints: string[] = [];

  if (database !== "ok") {
    hints.push(
      "Revisá que el proyecto Supabase no esté pausado y que DATABASE_URL en Vercel use el pooler (puerto 6543) con pgbouncer=true."
    );
  }
  if (!dbConfig.serverlessReady) {
    hints.push(
      "La URL de la base no cumple el mínimo recomendado para serverless (pooler 6543 + pgbouncer=true)."
    );
  }
  if (database === "ok" && databaseLatencyMs != null && databaseLatencyMs > 800) {
    hints.push(
      `Latencia alta (${databaseLatencyMs} ms). Con plan pago de Supabase y región cercana a Vercel suele mejorar.`
    );
  }

  const ok = database === "ok";

  const body = {
    ok,
    message: ok ? "Fadu.store API OK" : "API con problemas de base de datos",
    database,
    databaseLatencyMs,
    databaseUrlConfigured: dbConfig.configured,
    databaseConfig: {
      usesPooler: dbConfig.usesPooler,
      hasPgbouncer: dbConfig.hasPgbouncer,
      hasConnectionLimit: dbConfig.hasConnectionLimit,
      connectionLimit: dbConfig.connectionLimit,
      serverlessReady: dbConfig.serverlessReady,
      warnings: configWarnings,
    },
    blobConfigured,
    hints: hints.length > 0 ? hints : undefined,
    ...(database !== "ok"
      ? {
          databaseError,
          check:
            "GET /api/products con lista vacía, home sin destacados o vista rápida 503 suelen ser este problema.",
        }
      : {}),
  };

  return NextResponse.json(body, { status: ok ? 200 : 503 });
}
