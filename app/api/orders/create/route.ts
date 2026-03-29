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

function variantNote(size: string | null, color: string | null): string | null {
  const s = size?.trim();
  const c = color?.trim();
  if (!s && !c) return null;
  const parts: string[] = [];
  if (s) parts.push(`Talle ${s}`);
  if (c) parts.push(c);
  return parts.join(" · ");
}

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
        variantNote: variantNote(i.variantSizeLabel ?? null, i.variantColorLabel ?? null),
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

type CartLine = {
  productId: string;
  quantity: number;
  variantId?: string | null;
};

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

    const lines: CartLine[] = [];
    for (const item of items) {
      if (!item || typeof item.productId !== "string" || !item.productId.trim()) {
        return NextResponse.json({ error: "Items inválidos" }, { status: 400 });
      }
      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty < 1 || !Number.isInteger(qty)) {
        return NextResponse.json({ error: "Cantidad inválida en un producto" }, { status: 400 });
      }
      const variantId =
        typeof item.variantId === "string" && item.variantId.trim()
          ? item.variantId.trim()
          : null;
      lines.push({ productId: item.productId.trim(), quantity: qty, variantId });
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

    const productIds = [...new Set(lines.map((l) => l.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        price: true,
        active: true,
        stock: true,
        useVariants: true,
      },
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

    for (const line of lines) {
      const p = productById.get(line.productId);
      if (!p?.active) {
        return NextResponse.json(
          { error: "Un producto del carrito ya no está a la venta. Quitáselo e intentá de nuevo." },
          { status: 400 }
        );
      }
      if (p.useVariants && !line.variantId) {
        return NextResponse.json(
          { error: "Elegí talle y/o color para los productos con variantes antes de finalizar el pedido." },
          { status: 400 }
        );
      }
      if (!p.useVariants && line.variantId) {
        return NextResponse.json({ error: "Items inválidos (variante no corresponde)." }, { status: 400 });
      }
    }

    const variantIdsNeed = [...new Set(lines.map((l) => l.variantId).filter(Boolean) as string[])];
    const variants =
      variantIdsNeed.length > 0
        ? await prisma.productVariant.findMany({
            where: { id: { in: variantIdsNeed } },
            select: {
              id: true,
              productId: true,
              stock: true,
              sizeLabel: true,
              colorLabel: true,
            },
          })
        : [];
    if (variants.length !== variantIdsNeed.length) {
      return NextResponse.json(
        { error: "Una variante del carrito ya no existe. Actualizá el carrito e intentá de nuevo." },
        { status: 400 }
      );
    }
    const variantById = new Map(variants.map((v) => [v.id, v]));

    const qtyByVariant = new Map<string, number>();
    const qtyByProductSimple = new Map<string, number>();

    for (const line of lines) {
      const p = productById.get(line.productId)!;
      if (p.useVariants && line.variantId) {
        const v = variantById.get(line.variantId);
        if (!v || v.productId !== line.productId) {
          return NextResponse.json({ error: "Items inválidos (variante incorrecta)." }, { status: 400 });
        }
        qtyByVariant.set(line.variantId, (qtyByVariant.get(line.variantId) ?? 0) + line.quantity);
      } else {
        qtyByProductSimple.set(line.productId, (qtyByProductSimple.get(line.productId) ?? 0) + line.quantity);
      }
    }

    for (const [vid, need] of qtyByVariant) {
      const v = variantById.get(vid)!;
      if (v.stock < need) {
        return NextResponse.json(
          { error: "No hay stock suficiente para la variante elegida. Ajustá el carrito e intentá de nuevo." },
          { status: 400 }
        );
      }
    }
    for (const [pid, need] of qtyByProductSimple) {
      const p = productById.get(pid)!;
      if (p.stock < need) {
        return NextResponse.json(
          { error: "No hay stock suficiente para uno de los productos. Ajustá cantidades e intentá de nuevo." },
          { status: 400 }
        );
      }
    }

    let total = 0;
    const lineCreates: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    for (const line of lines) {
      const p = productById.get(line.productId)!;
      const qty = line.quantity;
      total += Number(p.price) * qty;
      const v = line.variantId ? variantById.get(line.variantId) : undefined;
      lineCreates.push({
        product: { connect: { id: line.productId } },
        quantity: qty,
        price: p.price,
        ...(v
          ? {
              variant: { connect: { id: v.id } },
              variantSizeLabel: v.sizeLabel || null,
              variantColorLabel: v.colorLabel || null,
            }
          : {
              variantSizeLabel: null,
              variantColorLabel: null,
            }),
      });
    }

    const decVariant = new Map<string, number>();
    const decProduct = new Map<string, number>();
    for (const line of lines) {
      const p = productById.get(line.productId)!;
      if (p.useVariants && line.variantId) {
        decVariant.set(line.variantId, (decVariant.get(line.variantId) ?? 0) + line.quantity);
      } else {
        decProduct.set(line.productId, (decProduct.get(line.productId) ?? 0) + line.quantity);
      }
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
        order = await prisma.$transaction(async (tx) => {
          const o = await tx.order.create({
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
          for (const [vid, q] of decVariant) {
            await tx.productVariant.update({
              where: { id: vid },
              data: { stock: { decrement: q } },
            });
          }
          for (const [pid, q] of decProduct) {
            await tx.product.update({
              where: { id: pid },
              data: { stock: { decrement: q } },
            });
          }
          return o;
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
            variantNote: variantNote(i.variantSizeLabel ?? null, i.variantColorLabel ?? null),
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

    if (paymentMethod === "mercadopago") {
      const conf = await sendOrderConfirmationBestEffort(order.id);
      return NextResponse.json({
        orderId: order.id,
        initPoint: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=DEMO`,
        pickupCode: order.pickupCode,
        emailConfirmationSent: conf.ok,
        emailConfirmationError: conf.ok ? undefined : conf.error,
      });
    }

    const conf = await sendOrderConfirmationBestEffort(order.id);

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
