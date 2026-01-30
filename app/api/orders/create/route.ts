import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generatePickupCode, generateQRDataURL } from "@/lib/qr";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { items, paymentMethod, phone } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    if (!["mercadopago", "transfer"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
    }

    // Calcular total
    let total = 0;
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.price) {
        return NextResponse.json({ error: "Items inválidos" }, { status: 400 });
      }
      total += item.price * item.quantity;
    }

    // Contar pedidos para generar código único
    const orderCount = await prisma.order.count();
    const pickupCode = generatePickupCode(orderCount + 1);

    // Crear orden
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: paymentMethod === "transfer" ? "pending_payment" : "pending_payment",
        paymentMethod,
        total,
        pickupCode,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
        history: {
          create: {
            status: "pending_payment",
            note: `Pedido creado. Método: ${paymentMethod}`,
          },
        },
      },
    });

    // Si es Mercado Pago, crear preferencia
    if (paymentMethod === "mercadopago") {
      // TODO: Integrar SDK de Mercado Pago
      // Por ahora retornamos URL de ejemplo
      return NextResponse.json({
        orderId: order.id,
        initPoint: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=DEMO`,
        pickupCode: order.pickupCode,
      });
    }

    // Si es transferencia, retornar datos
    return NextResponse.json({
      orderId: order.id,
      pickupCode: order.pickupCode,
      paymentMethod: "transfer",
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Error al crear pedido" }, { status: 500 });
  }
}
