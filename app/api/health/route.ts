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
  };

  return NextResponse.json(body, { status: database === "ok" ? 200 : 503 });
}
