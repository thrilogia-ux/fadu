import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  buildPickupInfo,
  formatPickupSlotLabel,
  isValidTimeHHmm,
  DAY_NAMES,
} from "@/lib/pickup";

function isAdmin(session: { user?: { role?: string } } | null) {
  return session?.user && (session.user as { role?: string }).role === "admin";
}

export async function GET() {
  try {
    const session = await auth();
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let config = await prisma.pickupConfig.findUnique({
      where: { id: "default" },
      include: {
        slots: { orderBy: [{ sortOrder: "asc" }, { dayOfWeek: "asc" }] },
      },
    });

    if (!config) {
      return NextResponse.json({
        address: "Av. San Juan 350, CABA",
        notes: null,
        slots: [],
      });
    }

    return NextResponse.json({
      address: config.address,
      notes: config.notes,
      slots: config.slots.map((s) => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        dayName: DAY_NAMES[s.dayOfWeek] ?? "Día",
        startTime: s.startTime,
        endTime: s.endTime,
        active: s.active,
        sortOrder: s.sortOrder,
        label: formatPickupSlotLabel(s.dayOfWeek, s.startTime, s.endTime),
      })),
    });
  } catch (error) {
    console.error("Error fetching pickup config (admin):", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

type SlotInput = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active?: boolean;
  sortOrder?: number;
};

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const address =
      typeof body.address === "string" && body.address.trim()
        ? body.address.trim().slice(0, 300)
        : "Av. San Juan 350, CABA";
    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim().slice(0, 2000)
        : null;

    const rawSlots = Array.isArray(body.slots) ? (body.slots as SlotInput[]) : [];
    const slots: SlotInput[] = [];

    for (let i = 0; i < rawSlots.length; i++) {
      const s = rawSlots[i];
      const dayOfWeek = Number(s.dayOfWeek);
      const startTime = typeof s.startTime === "string" ? s.startTime.trim() : "";
      const endTime = typeof s.endTime === "string" ? s.endTime.trim() : "";

      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return NextResponse.json({ error: `Franja ${i + 1}: día inválido` }, { status: 400 });
      }
      if (!isValidTimeHHmm(startTime) || !isValidTimeHHmm(endTime)) {
        return NextResponse.json(
          { error: `Franja ${i + 1}: horario inválido (usá HH:mm)` },
          { status: 400 }
        );
      }
      if (startTime >= endTime) {
        return NextResponse.json(
          { error: `Franja ${i + 1}: la hora de inicio debe ser anterior al fin` },
          { status: 400 }
        );
      }

      slots.push({
        dayOfWeek,
        startTime,
        endTime,
        active: s.active !== false,
        sortOrder: typeof s.sortOrder === "number" ? s.sortOrder : i,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.pickupConfig.upsert({
        where: { id: "default" },
        create: { id: "default", address, notes },
        update: { address, notes },
      });

      await tx.pickupSlot.deleteMany({ where: { configId: "default" } });

      if (slots.length > 0) {
        await tx.pickupSlot.createMany({
          data: slots.map((s, i) => ({
            configId: "default",
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            active: s.active !== false,
            sortOrder: s.sortOrder ?? i,
          })),
        });
      }

      const config = await tx.pickupConfig.findUniqueOrThrow({
        where: { id: "default" },
        include: {
          slots: { orderBy: [{ sortOrder: "asc" }, { dayOfWeek: "asc" }] },
        },
      });

      return config;
    });

    const mapped = result.slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      dayName: DAY_NAMES[s.dayOfWeek] ?? "Día",
      startTime: s.startTime,
      endTime: s.endTime,
      active: s.active,
      sortOrder: s.sortOrder,
      label: formatPickupSlotLabel(s.dayOfWeek, s.startTime, s.endTime),
    }));

    return NextResponse.json(buildPickupInfo(result.address, result.notes, mapped));
  } catch (error) {
    console.error("Error saving pickup config:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
