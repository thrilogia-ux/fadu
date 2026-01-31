import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { title, subtitle, buttonText, buttonLink, imageUrl, imagePosition, order, active } = body;

    const slide = await prisma.heroSlide.update({
      where: { id },
      data: {
        title: title || null,
        subtitle: subtitle || null,
        buttonText: buttonText || null,
        buttonLink: buttonLink || null,
        imageUrl: imageUrl || null,
        imagePosition: imagePosition || "50% 50%",
        order: order ?? 0,
        active: active ?? true,
      },
    });

    return NextResponse.json(slide);
  } catch (error) {
    console.error("Error updating hero slide:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.heroSlide.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting hero slide:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
