import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeDatabaseUrl, normalizeServerlessDatabaseUrl } from "@/lib/database-url";
import { STORE_NAME } from "@/lib/brand";
import { getAuthEnvStatus } from "@/lib/google-auth-env";
import { countActiveProducts } from "@/lib/product-queries";

export const dynamic = "force-dynamic";

/** Comprueba API, PostgreSQL y configuración recomendada Vercel + Supabase. */
export async function GET() {
  const dbConfig = analyzeDatabaseUrl(process.env.DATABASE_URL);
  const normalizedUrl = normalizeServerlessDatabaseUrl(process.env.DATABASE_URL);
  const urlNormalizedAtRuntime =
    Boolean(process.env.DATABASE_URL?.trim()) &&
    Boolean(normalizedUrl) &&
    normalizedUrl !== process.env.DATABASE_URL?.trim();
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const authEnv = getAuthEnvStatus();

  let database: "ok" | "error" = "error";
  let databaseLatencyMs: number | null = null;
  let databaseError: string | undefined;

  const started = Date.now();
  let activeProductCount: number | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
    databaseLatencyMs = Date.now() - started;
    activeProductCount = await countActiveProducts();
  } catch (e) {
    databaseLatencyMs = Date.now() - started;
    databaseError = e instanceof Error ? e.message : String(e);
    console.error("[health] falló conexión a la base:", e);
  }

  const hints: string[] = [];

  if (database !== "ok") {
    hints.push(
      "Revisá que el proyecto Supabase no esté pausado y que DATABASE_URL en Vercel use el pooler (puerto 6543) con pgbouncer=true."
    );
  }
  if (!dbConfig.serverlessReady && !urlNormalizedAtRuntime) {
    hints.push(
      "La URL de la base no cumple el mínimo recomendado para serverless (pooler 6543 + pgbouncer=true). Actualizala en Vercel."
    );
  }
  if (urlNormalizedAtRuntime) {
    hints.push(
      "La app normaliza DATABASE_URL en runtime (5432→6543). Igual conviene corregir la variable en Vercel y redeploy."
    );
  }
  if (database === "ok" && databaseLatencyMs != null && databaseLatencyMs > 800) {
    hints.push(
      `Latencia alta (${databaseLatencyMs} ms). Con plan pago de Supabase y región cercana a Vercel suele mejorar.`
    );
  }

  if (!authEnv.googleOAuthConfigured) {
    hints.push(
      "Google OAuth: faltan GOOGLE_CLIENT_ID y/o GOOGLE_CLIENT_SECRET en Vercel (Environment Production) y redeploy."
    );
  }
  if (!authEnv.authSecretConfigured) {
    hints.push("Falta AUTH_SECRET en el servidor.");
  }
  if (authEnv.googleOAuthConfigured) {
    hints.push(
      "Google OAuth: registrá ambos redirect URIs en Google Cloud: ubafadu.shop y www.ubafadu.shop (/api/auth/callback/google)."
    );
  }

  const ok = database === "ok";

  const body = {
    ok,
    message: ok ? `${STORE_NAME} API OK` : "API con problemas de base de datos",
    database,
    databaseLatencyMs,
    activeProductCount,
    databaseUrlConfigured: dbConfig.configured,
    databaseConfig: {
      poolMode: dbConfig.poolMode,
      usesPooler: dbConfig.usesPooler,
      hasPgbouncer: dbConfig.hasPgbouncer,
      hasConnectionLimit: dbConfig.hasConnectionLimit,
      connectionLimit: dbConfig.connectionLimit,
      serverlessReady: dbConfig.serverlessReady || urlNormalizedAtRuntime,
      urlNormalizedAtRuntime,
      warnings: dbConfig.warnings,
    },
    blobConfigured,
    auth: authEnv,
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
