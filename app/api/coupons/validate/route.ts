import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateCouponForCart } from "@/lib/coupons";

export async function POST(request: Request) {
  try {
    const { code, cartTotal } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }

    const total = Number(cartTotal);
    if (!Number.isFinite(total) || total < 0) {
      return NextResponse.json({ error: "Total del carrito inválido" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    const result = validateCouponForCart(coupon, total);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      discount: result.discount,
      coupon: result.coupon,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json({ error: "Error al validar cupón" }, { status: 500 });
  }
}
