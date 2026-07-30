import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFairModeSettings, upsertFairModeSettings } from "@/lib/fair-mode";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const settings = await getFairModeSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const current = await getFairModeSettings();
  await upsertFairModeSettings({
    enabled: typeof body.enabled === "boolean" ? body.enabled : current.enabled,
    title: typeof body.title === "string" ? body.title.trim().slice(0, 120) : current.title,
    message: typeof body.message === "string" ? body.message.trim().slice(0, 500) : current.message,
    hideMercadoPago:
      typeof body.hideMercadoPago === "boolean" ? body.hideMercadoPago : current.hideMercadoPago,
  });

  return NextResponse.json(await getFairModeSettings());
}
