import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generatePickupCode } from "@/lib/qr";
import { isBundleType } from "@/lib/bundles";
import {
  sendOrderConfirmation,
  sendPickupReadyEmail,
  type SendEmailResult,
} from "@/lib/email";
import { validateCouponForCart } from "@/lib/coupons";
import {
  ensureOrderSchema,
  isMissingColumnError,
  isMissingDiscountColumnError,
  isMissingPickupCodeColumnError,
  prismaErrorMessage,
} from "@/lib/order-schema";
import { isMaxConnectionsSessionError } from "@/lib/database-url";
import { getFairModeSettings } from "@/lib/fair-mode";
import { buildPaidOrderUpdate } from "@/lib/finance-order";
import { ensureFinanceSchema } from "@/lib/finance-schema";
import {
  getShippingSettings,
  parseShippingAddress,
  quoteShipping,
} from "@/lib/shipping-zones";

class OrderCouponError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderCouponError";
  }
}

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
      discountTotal: Number(fullOrder.discountTotal ?? 0),
      items: fullOrder.items.map((i) => ({
        quantity: i.quantity,
        price: Number(i.price),
        product: i.product,
        productNameSnapshot: i.productNameSnapshot,
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
  let isAdminUser = false;

  try {
    await ensureOrderSchema();
    await ensureFinanceSchema();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    isAdminUser = (session.user as { role?: string })?.role === "admin";

    const { items, paymentMethod, phone: phoneBody, couponCode: couponCodeBody, deliveryMethod: deliveryMethodBody, shippingAddress: shippingAddressBody } =
      await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Carrito vacío" }, { status: 400 });
    }

    const isAdmin = isAdminUser;
    const fairMode = await getFairModeSettings();
    const isFairPresencial = fairMode.mode === "presencial";

    const validMethods = [
      "mercadopago",
      "transfer",
      ...(isFairPresencial ? ["feria_presencial"] : []),
      ...(isAdmin ? ["test"] : []),
    ];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json({ error: "Método de pago inválido" }, { status: 400 });
    }

    if (paymentMethod === "feria_presencial" && !isFairPresencial) {
      return NextResponse.json(
        { error: "La venta presencial en feria no está activa." },
        { status: 400 }
      );
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

    if (typeof phoneBody === "string" && phoneBody.trim()) {
      const trimmedPhone = phoneBody.trim().slice(0, 40);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone: trimmedPhone },
      });
    }

    const productIds = [...new Set(lines.map((l) => l.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        active: true,
        stock: true,
        useVariants: true,
        productType: true,
        costPrice: true,
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
      if (p.useVariants && !isBundleType(p.productType) && !line.variantId) {
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

    let subtotal = 0;
    const lineCreates: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    for (const line of lines) {
      const p = productById.get(line.productId)!;
      const qty = line.quantity;
      subtotal += Number(p.price) * qty;
      const v = line.variantId ? variantById.get(line.variantId) : undefined;
      lineCreates.push({
        product: { connect: { id: line.productId } },
        productNameSnapshot: p.name,
        quantity: qty,
        price: p.price,
        unitCostSnapshot: p.costPrice ?? null,
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

    const couponCodeStr =
      typeof couponCodeBody === "string" && couponCodeBody.trim()
        ? couponCodeBody.trim().toUpperCase()
        : null;

    let discountAmount = 0;
    let couponIdToApply: string | null = null;

    if (couponCodeStr) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCodeStr },
      });
      const couponResult = validateCouponForCart(coupon, subtotal);
      if (!couponResult.ok) {
        return NextResponse.json({ error: couponResult.error }, { status: 400 });
      }
      discountAmount = couponResult.discount;
      couponIdToApply = couponResult.coupon.id;
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

    const bundleIds = products
      .filter((p) => isBundleType(p.productType))
      .map((p) => p.id);
    const bundleComponents =
      bundleIds.length > 0
        ? await prisma.bundleItem.findMany({
            where: { bundleProductId: { in: bundleIds } },
          })
        : [];

    const isFeriaPresencialOrder = paymentMethod === "feria_presencial";
    const deliveryMethod =
      deliveryMethodBody === "shipping" && !isFeriaPresencialOrder ? "shipping" : "pickup";

    let shippingCost = 0;
    let shippingData: {
      deliveryMethod: string;
      shippingCost: number;
      shippingZoneId?: string | null;
      shippingZoneName?: string | null;
      shippingPostalCode?: string | null;
      shippingAddress?: string | null;
    } = { deliveryMethod: "pickup", shippingCost: 0 };

    if (deliveryMethod === "shipping") {
      const shippingSettings = await getShippingSettings();
      if (!shippingSettings.enabled) {
        return NextResponse.json({ error: "Los envíos no están habilitados." }, { status: 400 });
      }
      const parsedAddress = parseShippingAddress(shippingAddressBody);
      if (!parsedAddress) {
        return NextResponse.json({ error: "Dirección de envío incompleta." }, { status: 400 });
      }
      const quote = quoteShipping(
        parsedAddress.postalCode,
        shippingSettings,
        subtotal - discountAmount
      );
      if (!quote.ok) {
        return NextResponse.json({ error: quote.error }, { status: 400 });
      }
      shippingCost = quote.price;
      shippingData = {
        deliveryMethod: "shipping",
        shippingCost,
        shippingZoneId: quote.zoneId,
        shippingZoneName: quote.zoneName,
        shippingPostalCode: quote.postalCode,
        shippingAddress: JSON.stringify(parsedAddress),
      };
    }

    const feriaPaidUpdate = isFeriaPresencialOrder
      ? await buildPaidOrderUpdate("feria_presencial", subtotal - discountAmount)
      : null;
    const initialStatus = isFeriaPresencialOrder
      ? "completed"
      : paymentMethod === "test"
        ? deliveryMethod === "shipping"
          ? "preparing"
          : "ready_for_pickup"
        : "pending_payment";
    const deliveryNote =
      deliveryMethod === "shipping"
        ? `Envío ${shippingData.shippingZoneName ?? ""} ($${shippingCost.toLocaleString("es-AR")})`.trim()
        : "Retiro en FADU";
    const historyNoteBase = `Pedido creado. ${deliveryNote}. Pago: ${paymentMethod}`;
    const historyNote =
      couponCodeStr && discountAmount > 0
        ? `${historyNoteBase}. Cupón ${couponCodeStr} (-$${discountAmount.toLocaleString("es-AR")})`
        : historyNoteBase;

    const historyEntries = isFeriaPresencialOrder
      ? [
          { status: "pending_payment", note: historyNote },
          { status: "paid", note: "Pago en stand (feria presencial)" },
          { status: "completed", note: "Entrega inmediata en el stand de la feria" },
        ]
      : paymentMethod === "test"
        ? deliveryMethod === "shipping"
          ? [
              { status: "pending_payment", note: "Pedido creado (pago de prueba)" },
              { status: "paid", note: "Pago simulado (admin)" },
              { status: "preparing", note: "Preparando envío (simulación)" },
            ]
          : [
              { status: "pending_payment", note: "Pedido creado (pago de prueba)" },
              { status: "paid", note: "Pago simulado (admin)" },
              { status: "preparing", note: "Preparación simulgada" },
              { status: "ready_for_pickup", note: "Listo para retiro (simulación)" },
            ]
        : [{ status: "pending_payment", note: historyNote }];

    const orderCountBase = await prisma.order.count();
    let order: Awaited<ReturnType<typeof prisma.order.create>> | null = null;
    let lastCreateError: unknown;

    for (let attempt = 0; attempt < 12; attempt++) {
      const pickupCode = generatePickupCode(orderCountBase + 1 + attempt);
      try {
        order = await prisma.$transaction(async (tx) => {
          if (couponIdToApply) {
            const coupon = await tx.coupon.findUnique({ where: { id: couponIdToApply } });
            const couponResult = validateCouponForCart(coupon, subtotal);
            if (!couponResult.ok) {
              throw new OrderCouponError(couponResult.error);
            }
          }

          const finalTotal = subtotal - discountAmount + shippingCost;

          const o = await tx.order.create({
            data: {
              userId: session.user.id,
              status: initialStatus,
              paymentMethod,
              total: finalTotal,
              discountTotal: discountAmount,
              pickupCode,
              deliveryMethod: shippingData.deliveryMethod,
              shippingCost: shippingData.shippingCost,
              shippingZoneId: shippingData.shippingZoneId ?? null,
              shippingZoneName: shippingData.shippingZoneName ?? null,
              shippingPostalCode: shippingData.shippingPostalCode ?? null,
              shippingAddress: shippingData.shippingAddress ?? null,
              ...(isFeriaPresencialOrder && feriaPaidUpdate
                ? {
                    pickupDate: new Date(),
                    pickedUpBy: "Entrega en stand (feria)",
                    paidAt: feriaPaidUpdate.paidAt,
                    platformFee: feriaPaidUpdate.platformFee,
                    netReceived: feriaPaidUpdate.netReceived,
                  }
                : {}),
              items: { create: lineCreates },
              history: { create: historyEntries },
            },
          });

          if (couponIdToApply) {
            await tx.coupon.update({
              where: { id: couponIdToApply },
              data: { usedCount: { increment: 1 } },
            });
          }
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
          for (const line of lines) {
            const p = productById.get(line.productId)!;
            if (!isBundleType(p.productType)) continue;
            const comps = bundleComponents.filter((b) => b.bundleProductId === line.productId);
            for (const bi of comps) {
              await tx.product.update({
                where: { id: bi.componentProductId },
                data: { stock: { decrement: bi.quantity * line.quantity } },
              });
            }
          }
          return o;
        });
        break;
      } catch (e) {
        lastCreateError = e;
        if (e instanceof OrderCouponError) {
          return NextResponse.json({ error: e.message }, { status: 400 });
        }
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

    if (paymentMethod === "feria_presencial") {
      const conf = await sendOrderConfirmationBestEffort(order.id);
      return NextResponse.json({
        orderId: order.id,
        pickupCode: order.pickupCode,
        paymentMethod: "feria_presencial",
        fairPresencial: true,
        emailConfirmationSent: conf.ok,
        emailConfirmationError: conf.ok ? undefined : conf.error,
      });
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
          discountTotal: Number(fullOrder.discountTotal ?? 0),
          items: fullOrder.items.map((i) => ({
            quantity: i.quantity,
            price: Number(i.price),
            product: i.product,
            productNameSnapshot: i.productNameSnapshot,
            variantNote: variantNote(i.variantSizeLabel ?? null, i.variantColorLabel ?? null),
          })),
        };
        const conf = await sendOrderConfirmation(orderForEmail);
        emailConfirmationSent = conf.ok;
        emailConfirmationError = conf.ok ? undefined : conf.error;
        if (fullOrder.deliveryMethod !== "shipping") {
          const pickMail = await sendPickupReadyEmail(orderForEmail);
          emailPickupSent = pickMail.ok;
          emailPickupError = pickMail.ok ? undefined : pickMail.error;
          if (!pickMail.ok) {
            console.error("[orders/create] test sendPickupReadyEmail:", pickMail.error);
          }
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
    if (isMissingDiscountColumnError(error) || isMissingPickupCodeColumnError(error)) {
      return NextResponse.json(
        {
          error:
            "Faltan columnas de pedidos en la base de datos. Ejecutá en Supabase SQL Editor el archivo prisma/fix-orders-production.sql y volvé a intentar.",
        },
        { status: 503 }
      );
    }
    if (isMissingColumnError(error)) {
      return NextResponse.json(
        {
          error:
            "La base de datos no está actualizada para pedidos. Ejecutá prisma/fix-orders-production.sql en Supabase.",
          detail: prismaErrorMessage(error),
        },
        { status: 503 }
      );
    }
    if (isMaxConnectionsSessionError(error)) {
      return NextResponse.json(
        {
          error:
            "Base de datos saturada (session mode). En Vercel → DATABASE_URL usá el pooler Transaction (puerto 6543) con ?pgbouncer=true&connection_limit=1&sslmode=require. Redeploy después de cambiar la variable.",
        },
        { status: 503 }
      );
    }
    const detail = prismaErrorMessage(error);
    return NextResponse.json(
      {
        error: "Error al crear pedido",
        ...(isAdminUser && detail ? { detail } : {}),
      },
      { status: 500 }
    );
  }
}
