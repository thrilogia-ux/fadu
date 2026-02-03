import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const emptyResponse = () =>
  NextResponse.json({
    reviews: [],
    summary: {
      average: 0,
      total: 0,
      distribution: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 })),
    },
  });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const reviews = await prisma.productReview.findMany({
      where: { productId: product.id, status: "approved" },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;
    const distribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: reviews.filter((r) => r.rating === stars).length,
    }));

    return NextResponse.json({
      reviews,
      summary: { average: avg, total, distribution },
    });
  } catch (error: unknown) {
    console.error("Error fetching reviews:", error);
    const msg = error instanceof Error ? error.message : "";
    if (
      msg.includes("product_reviews") ||
      msg.includes("does not exist") ||
      msg.includes("relation")
    ) {
      return emptyResponse();
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debés iniciar sesión para opinar" },
        { status: 401 }
      );
    }

    const { rating, comment } = await request.json();

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { error: "La calificación debe ser de 1 a 5" },
        { status: 400 }
      );
    }

    if (comment && comment.trim().length > 500) {
      return NextResponse.json(
        { error: "El comentario no puede superar los 500 caracteres" },
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

    const existing = await prisma.productReview.findUnique({
      where: {
        productId_userId: {
          productId: product.id,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya dejaste una opinión para este producto" },
        { status: 400 }
      );
    }

    const newReview = await prisma.productReview.create({
      data: {
        productId: product.id,
        userId: session.user.id,
        rating: numericRating,
        comment: comment?.trim() || null,
        status: "pending",
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return NextResponse.json(newReview);
  } catch (error: unknown) {
    console.error("Error creating review:", error);
    const msg = error instanceof Error ? error.message : "";
    if (
      msg.includes("product_reviews") ||
      msg.includes("does not exist") ||
      msg.includes("relation")
    ) {
      return NextResponse.json(
        { error: "Las opiniones aún no están disponibles. Por favor intentá más tarde." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
