import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET - Obtener preguntas de un producto
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const questions = await prisma.productQuestion.findMany({
      where: { productId: product.id },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST - Hacer una pregunta
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Debés iniciar sesión para preguntar" }, { status: 401 });
    }

    const { question } = await request.json();

    if (!question || question.trim().length < 10) {
      return NextResponse.json(
        { error: "La pregunta debe tener al menos 10 caracteres" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const newQuestion = await prisma.productQuestion.create({
      data: {
        productId: product.id,
        userId: session.user.id,
        question: question.trim(),
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return NextResponse.json(newQuestion);
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
