import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFinanceSettings, upsertFinanceSettings } from "@/lib/finance-settings";
import { ensureFinanceSchema } from "@/lib/finance-schema";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  await ensureFinanceSchema();
  return NextResponse.json(await getFinanceSettings());
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await ensureFinanceSchema();
  const body = await request.json();
  const current = await getFinanceSettings();

  const mpCommissionPercent =
    typeof body.mpCommissionPercent === "number" && body.mpCommissionPercent >= 0
      ? body.mpCommissionPercent
      : current.mpCommissionPercent;
  const mpFixedFee =
    typeof body.mpFixedFee === "number" && body.mpFixedFee >= 0 ? body.mpFixedFee : current.mpFixedFee;

  await upsertFinanceSettings({ mpCommissionPercent, mpFixedFee });
  return NextResponse.json(await getFinanceSettings());
}
