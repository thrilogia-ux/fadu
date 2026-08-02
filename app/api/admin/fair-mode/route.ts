import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getFairModeSettings,
  upsertFairModeSettings,
  type FairModeType,
} from "@/lib/fair-mode";

function parseMode(v: unknown): FairModeType | null {
  if (v === "off" || v === "pickup_qr" || v === "presencial") return v;
  return null;
}

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

  let mode: FairModeType = current.mode;
  if (typeof body.mode === "string") {
    const parsed = parseMode(body.mode);
    if (parsed) mode = parsed;
  } else if (typeof body.enabled === "boolean") {
    mode = body.enabled ? (current.mode === "off" ? "pickup_qr" : current.mode) : "off";
  }

  await upsertFairModeSettings({
    mode,
    enabled: mode !== "off",
    title: typeof body.title === "string" ? body.title.trim().slice(0, 120) : current.title,
    message: typeof body.message === "string" ? body.message.trim().slice(0, 500) : current.message,
    hideMercadoPago:
      typeof body.hideMercadoPago === "boolean" ? body.hideMercadoPago : current.hideMercadoPago,
  });

  return NextResponse.json(await getFairModeSettings());
}
