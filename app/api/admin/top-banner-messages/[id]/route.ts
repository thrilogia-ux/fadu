import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data: { text?: string; order?: number; active?: boolean } = {};

    if (body.text !== undefined) {
      const t = typeof body.text === "string" ? body.text.trim() : "";
      if (!t || t.length > 500) {
        return NextResponse.json(
          { error: "Texto inválido (máx. 500 caracteres)" },
          { status: 400 }
        );
      }
      data.text = t;
    }
    if (typeof body.order === "number") data.order = body.order;
    if (typeof body.active === "boolean") data.active = body.active;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const message = await prisma.topBannerMessage.update({
      where: { id },
      data,
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error updating top banner message:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.topBannerMessage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting top banner message:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
