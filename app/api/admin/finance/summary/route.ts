import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFinanceSummary } from "@/lib/finance";
import { ensureFinanceSchema } from "@/lib/finance-schema";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await ensureFinanceSchema();

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()), 10);
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1), 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Mes o año inválido" }, { status: 400 });
  }

  const summary = await getFinanceSummary(year, month);
  return NextResponse.json(summary);
}
