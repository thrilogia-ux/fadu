import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const slides = await prisma.heroSlide.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json(slides);
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { title, subtitle, buttonText, buttonLink, imageUrl, order, active } = body;

    const slide = await prisma.heroSlide.create({
      data: {
        title: title || null,
        subtitle: subtitle || null,
        buttonText: buttonText || null,
        buttonLink: buttonLink || null,
        imageUrl: imageUrl || null,
        order: order ?? 0,
        active: active ?? true,
      },
    });

    return NextResponse.json(slide);
  } catch (error) {
    console.error("Error creating hero slide:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
