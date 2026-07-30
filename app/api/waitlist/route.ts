import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const variantId =
      typeof body.variantId === "string" && body.variantId.trim()
        ? body.variantId.trim()
        : null;
    let email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!productId) {
      return NextResponse.json({ error: "Producto requerido" }, { status: 400 });
    }

    if (!email && session?.user?.email) {
      email = session.user.email.trim().toLowerCase();
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email válido requerido" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, active: true, name: true },
    });
    if (!product?.active) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const existing = await prisma.stockWaitlist.findFirst({
      where: {
        email,
        productId,
        variantId: variantId ?? null,
        notifiedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json({ ok: true, message: "Ya estás en la lista de espera" });
    }

    await prisma.stockWaitlist.create({
      data: {
        email,
        productId,
        variantId,
        userId: session?.user?.id ?? null,
      },
    });

    return NextResponse.json({ ok: true, message: "Te avisaremos cuando haya stock" });
  } catch (error) {
    console.error("[waitlist]", error);
    return NextResponse.json({ error: "Error al registrar" }, { status: 500 });
  }
}
