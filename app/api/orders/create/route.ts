import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generatePickupCode } from "@/lib/qr";
import { sendOrderConfirmation, sendPickupReadyEmail } from "@/lib/email";

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

    const isAdmin = (session.user as { role?: string })?.role === "admin";
    const validMethods = ["mercadopago", "transfer", ...(isAdmin ? ["test"] : [])];
    if (!validMethods.includes(paymentMethod)) {
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

    const initialStatus = paymentMethod === "test" ? "ready_for_pickup" : "pending_payment";
    const historyEntries =
      paymentMethod === "test"
        ? [
            { status: "pending_payment", note: "Pedido creado (pago de prueba)" },
            { status: "paid", note: "Pago simulado (admin)" },
            { status: "preparing", note: "Preparación simulgada" },
            { status: "ready_for_pickup", note: "Listo para retiro (simulación)" },
          ]
        : [{ status: "pending_payment", note: `Pedido creado. Método: ${paymentMethod}` }];

    // Crear orden
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: initialStatus,
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
          create: historyEntries,
        },
      },
    });

    // Pago de prueba: enviar emails y retornar
    if (paymentMethod === "test") {
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: { include: { product: { select: { name: true } } } },
          user: { select: { email: true, name: true } },
        },
      });
      if (fullOrder) {
        const orderForEmail = {
          ...fullOrder,
          total: Number(fullOrder.total),
          items: fullOrder.items.map((i) => ({
            quantity: i.quantity,
            price: Number(i.price),
            product: i.product,
          })),
        };
        await sendOrderConfirmation(orderForEmail);
        await sendPickupReadyEmail(orderForEmail);
      }
      return NextResponse.json({
        orderId: order.id,
        pickupCode: order.pickupCode,
        paymentMethod: "test",
      });
    }

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
