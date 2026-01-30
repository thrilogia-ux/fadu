import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { code, type, value, minPurchase, validFrom, validUntil, usageLimit, active } = body;

    const coupon = await prisma.coupon.update({
      where: { id },
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
    console.error("Error updating coupon:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
