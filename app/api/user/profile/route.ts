import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidFaduCareerSlug } from "@/lib/fadu-careers";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      faduCareer: true,
      faduCareerOther: true,
      image: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const data: {
    name?: string | null;
    phone?: string | null;
    faduCareer?: string | null;
    faduCareerOther?: string | null;
  } = {};

  if (typeof body.name === "string") {
    const t = body.name.trim();
    data.name = t.length > 120 ? t.slice(0, 120) : t || null;
  }

  if (typeof body.phone === "string") {
    const t = body.phone.trim();
    data.phone = t.length > 40 ? t.slice(0, 40) : t || null;
  }

  if ("faduCareer" in body) {
    const raw = typeof body.faduCareer === "string" ? body.faduCareer.trim() : "";
    if (raw === "") {
      data.faduCareer = null;
      data.faduCareerOther = null;
    } else {
      if (!isValidFaduCareerSlug(raw)) {
        return NextResponse.json({ error: "Carrera no válida" }, { status: 400 });
      }
      data.faduCareer = raw;
      if (raw === "otra") {
        const o = typeof body.faduCareerOther === "string" ? body.faduCareerOther.trim() : "";
        if (o.length > 255) {
          return NextResponse.json({ error: "Texto demasiado largo" }, { status: 400 });
        }
        data.faduCareerOther = o || null;
      } else {
        data.faduCareerOther = null;
      }
    }
  } else if (typeof body.faduCareerOther === "string") {
    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { faduCareer: true },
    });
    if (current?.faduCareer === "otra") {
      const o = body.faduCareerOther.trim();
      if (o.length > 255) {
        return NextResponse.json({ error: "Texto demasiado largo" }, { status: 400 });
      }
      data.faduCareerOther = o || null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar" }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        name: true,
        email: true,
        phone: true,
        faduCareer: true,
        faduCareerOther: true,
        image: true,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("[user/profile] PATCH", e);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
