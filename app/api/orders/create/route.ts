import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generatePickupCode } from "@/lib/qr";
import {
  sendOrderConfirmation,
  sendPickupReadyEmail,
  type SendEmailResult,
} from "@/lib/email";

async function sendOrderConfirmationBestEffort(orderId: string): Promise<SendEmailResult> {
  try {
    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { name: true } } } },
        user: { select: { email: true, name: true } },
      },
    });
    if (!fullOrder) {
      return { ok: false, error: "Pedido no encontrado para enviar confirmación" };
    }
    const orderForEmail = {
      ...fullOrder,
      total: Number(fullOrder.total),
      items: fullOrder.items.map((i) => ({
        quantity: i.quantity,
        price: Number(i.price),
        product: i.product,
      })),
    };
    const result = await sendOrderConfirmation(orderForEmail);
    if (!result.ok) {
      console.error("[orders/create] email confirmación:", result.error);
    }
    return result;
  } catch (e) {
    console.error("[orders/create] email confirmación:", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { items, paymentMethod } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    const isAdmin = (session.user as { role?: string })?.role === "admin";
    const validMethods = ["mercadopago", "transfer", ...(isAdmin ? ["test"] : [])];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
    }

    for (const item of items) {
      if (!item || typeof item.productId !== "string" || !item.productId.trim()) {
        return NextResponse.json({ error: "Items inválidos" }, { status: 400 });
      }
      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty < 1 || !Number.isInteger(qty)) {
        return NextResponse.json({ error: "Cantidad inválida en un producto" }, { status: 400 });
      }
    }

    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!userExists) {
      return NextResponse.json(
        { error: "Usuario no encontrado. Cerrá sesión y volvé a entrar." },
        { status: 401 }
      );
    }

    const productIds = [...new Set(items.map((i: { productId: string }) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, active: true, stock: true },
    });
    if (products.length !== productIds.length) {
      return NextResponse.json(
        {
          error:
            "Hay productos en el carrito que ya no existen. Quitálos del carrito e intentá de nuevo.",
        },
        { status: 400 }
      );
    }

    const productById = new Map(products.map((p) => [p.id, p]));

    const qtyByProduct = new Map<string, number>();
    for (const item of items) {
      const pid = String(item.productId).trim();
      const q = Number(item.quantity);
      qtyByProduct.set(pid, (qtyByProduct.get(pid) ?? 0) + q);
    }
    for (const [pid, needQty] of qtyByProduct) {
      const p = productById.get(pid);
      if (!p) {
        return NextResponse.json({ error: "Items inválidos" }, { status: 400 });
      }
      if (!p.active) {
        return NextResponse.json(
          { error: "Un producto del carrito ya no está a la venta. Quitáselo e intentá de nuevo." },
          { status: 400 }
        );
      }
      if (p.stock < needQty) {
        return NextResponse.json(
          { error: "No hay stock suficiente para uno de los productos. Ajustá cantidades e intentá de nuevo." },
          { status: 400 }
        );
      }
    }

    let total = 0;
    const lineCreates: { productId: string; quantity: number; price: Prisma.Decimal }[] = [];
    for (const item of items) {
      const qty = Number(item.quantity);
      const p = productById.get(item.productId);
      if (!p) {
        return NextResponse.json({ error: "Items inválidos" }, { status: 400 });
      }
      const lineTotal = Number(p.price) * qty;
      total += lineTotal;
      lineCreates.push({
        productId: item.productId,
        quantity: qty,
        price: p.price,
      });
    }

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

    const orderCountBase = await prisma.order.count();
    let order: Awaited<ReturnType<typeof prisma.order.create>> | null = null;
    let lastCreateError: unknown;
    for (let attempt = 0; attempt < 12; attempt++) {
      const pickupCode = generatePickupCode(orderCountBase + 1 + attempt);
      try {
        order = await prisma.order.create({
          data: {
            userId: session.user.id,
            status: initialStatus,
            paymentMethod,
            total,
            pickupCode,
            items: { create: lineCreates },
            history: { create: historyEntries },
          },
        });
        break;
      } catch (e) {
        lastCreateError = e;
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
          continue;
        }
        throw e;
      }
    }
    if (!order) {
      console.error("[orders/create] pickup code retry exhausted:", lastCreateError);
      return NextResponse.json(
        { error: "No se pudo generar un código de retiro único. Intentá de nuevo en unos segundos." },
        { status: 503 }
      );
    }

    // Pago de prueba: enviar emails y retornar
    if (paymentMethod === "test") {
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: {
          items: { include: { product: { select: { name: true } } } },
          user: { select: { email: true, name: true } },
        },
      });
      let emailConfirmationSent = false;
      let emailConfirmationError: string | undefined = fullOrder
        ? undefined
        : "No se pudo cargar el pedido para enviar emails";
      let emailPickupSent: boolean | undefined;
      let emailPickupError: string | undefined;
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
        const conf = await sendOrderConfirmation(orderForEmail);
        emailConfirmationSent = conf.ok;
        emailConfirmationError = conf.ok ? undefined : conf.error;
        const pickMail = await sendPickupReadyEmail(orderForEmail);
        emailPickupSent = pickMail.ok;
        emailPickupError = pickMail.ok ? undefined : pickMail.error;
        if (!pickMail.ok) {
          console.error("[orders/create] test sendPickupReadyEmail:", pickMail.error);
        }
      }
      return NextResponse.json({
        orderId: order.id,
        pickupCode: order.pickupCode,
        paymentMethod: "test",
        emailConfirmationSent,
        emailConfirmationError,
        emailPickupSent,
        emailPickupError,
      });
    }

    // Si es Mercado Pago, crear preferencia
    if (paymentMethod === "mercadopago") {
      const conf = await sendOrderConfirmationBestEffort(order.id);
      // TODO: Integrar SDK de Mercado Pago
      // Por ahora retornamos URL de ejemplo
      return NextResponse.json({
        orderId: order.id,
        initPoint: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=DEMO`,
        pickupCode: order.pickupCode,
        emailConfirmationSent: conf.ok,
        emailConfirmationError: conf.ok ? undefined : conf.error,
      });
    }

    const conf = await sendOrderConfirmationBestEffort(order.id);

    // Si es transferencia, retornar datos
    return NextResponse.json({
      orderId: order.id,
      pickupCode: order.pickupCode,
      paymentMethod: "transfer",
      emailConfirmationSent: conf.ok,
      emailConfirmationError: conf.ok ? undefined : conf.error,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            error:
              "No se pudo vincular el pedido con los datos guardados (producto o cuenta). Revisá el carrito o iniciá sesión de nuevo.",
          },
          { status: 400 }
        );
      }
    }
    return NextResponse.json({ error: "Error al crear pedido" }, { status: 500 });
  }
}
