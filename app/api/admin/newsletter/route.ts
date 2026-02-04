import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(subscribers);
  } catch (error: unknown) {
    console.error("Error fetching newsletter:", error);
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("newsletter_subscribers") || msg.includes("does not exist")) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
