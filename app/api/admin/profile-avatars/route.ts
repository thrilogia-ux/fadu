import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getProfileAvatars,
  saveProfileAvatars,
  type ProfileAvatarItem,
} from "@/lib/profile-avatars-store";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const avatars = await getProfileAvatars();
  return NextResponse.json(avatars);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const raw = (body as { avatars?: unknown })?.avatars;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "Se esperaba avatars[]" }, { status: 400 });
  }

  try {
    const saved = await saveProfileAvatars(raw as ProfileAvatarItem[]);
    return NextResponse.json(saved);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al guardar";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
