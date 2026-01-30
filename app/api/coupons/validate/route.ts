import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { code, cartTotal } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Cupón inválido" }, { status: 400 });
    }

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return NextResponse.json({ error: "Cupón expirado" }, { status: 400 });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "Cupón agotado" }, { status: 400 });
    }

    if (coupon.minPurchase && cartTotal < Number(coupon.minPurchase)) {
      return NextResponse.json(
        {
          error: `Compra mínima de $${Number(coupon.minPurchase).toLocaleString("es-AR")} requerida`,
        },
        { status: 400 }
      );
    }

    let discount = 0;
    if (coupon.type === "percent") {
      discount = (cartTotal * Number(coupon.value)) / 100;
    } else {
      discount = Number(coupon.value);
    }

    return NextResponse.json({
      discount: Math.min(discount, cartTotal),
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json({ error: "Error al validar cupón" }, { status: 500 });
  }
}
