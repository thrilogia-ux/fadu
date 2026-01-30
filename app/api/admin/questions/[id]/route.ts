import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// PATCH - Responder una pregunta (admin)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { answer } = await request.json();

    if (!answer || answer.trim().length < 5) {
      return NextResponse.json(
        { error: "La respuesta debe tener al menos 5 caracteres" },
        { status: 400 }
      );
    }

    const question = await prisma.productQuestion.update({
      where: { id },
      data: {
        answer: answer.trim(),
        answeredAt: new Date(),
        answeredBy: session.user.id,
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error("Error answering question:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE - Eliminar una pregunta (admin)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await prisma.productQuestion.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
