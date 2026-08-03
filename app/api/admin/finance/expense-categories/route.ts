import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureFinanceSchema } from "@/lib/finance-schema";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  await ensureFinanceSchema();
  const categories = await prisma.expenseCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await ensureFinanceSchema();
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!name) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  try {
    const category = await prisma.expenseCategory.create({
      data: { name, active: body.active !== false },
    });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Ya existe un tipo con ese nombre" }, { status: 400 });
  }
}
