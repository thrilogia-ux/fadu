import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Comprueba que la API responde y que PostgreSQL acepta conexión (Vercel/Supabase). */
export async function GET() {
  let database: "ok" | "error" = "error";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "ok";
  } catch (e) {
    console.error("[health] falló conexión a la base:", e);
  }

  const hasUrl = Boolean(process.env.DATABASE_URL?.trim());
  const body = {
    ok: database === "ok",
    message: "Fadu.store API OK",
    database,
    databaseUrlConfigured: hasUrl,
    /** Si `database` !== ok: revisá Vercel DATABASE_URL (pooler Supabase 6543, pgbouncer=true) y que el proyecto Supabase no esté pausado. */
    ...(database !== "ok"
      ? {
          check: "GET /api/products con lista vacía y home sin destacados suele ser esta conexión.",
        }
      : {}),
  };

  return NextResponse.json(body, { status: database === "ok" ? 200 : 503 });
}
