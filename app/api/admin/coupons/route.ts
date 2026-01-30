import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
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
    const { code, type, value, minPurchase, validFrom, validUntil, usageLimit, active } = body;

    if (!code || !type || !value) {
      return NextResponse.json(
        { error: "Código, tipo y valor son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el código no exista
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "Ya existe un cupón con ese código" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        minPurchase: minPurchase ? parseFloat(minPurchase) : null,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        active: active ?? true,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
