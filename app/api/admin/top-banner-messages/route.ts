import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const messages = await prisma.topBannerMessage.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching top banner messages (admin):", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text || text.length > 500) {
      return NextResponse.json(
        { error: "Texto requerido (máx. 500 caracteres)" },
        { status: 400 }
      );
    }

    const order = typeof body.order === "number" ? body.order : 0;
    const active = body.active !== false;

    const message = await prisma.topBannerMessage.create({
      data: {
        text,
        order,
        active,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating top banner message:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
