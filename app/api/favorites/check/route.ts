import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET - Verificar si un producto está en favoritos
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ isFavorite: false });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ isFavorite: false });
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    return NextResponse.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error("Error checking favorite:", error);
    return NextResponse.json({ isFavorite: false });
  }
}
