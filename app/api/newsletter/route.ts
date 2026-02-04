import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email requerido" },
        { status: 400 }
      );
    }

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: trimmed },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Este email ya está suscripto" },
        { status: 400 }
      );
    }

    await prisma.newsletterSubscriber.create({
      data: { email: trimmed },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Error subscribing:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("newsletter_subscribers") || msg.includes("does not exist")) {
      return NextResponse.json(
        { error: "El servicio de suscripción no está disponible" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
