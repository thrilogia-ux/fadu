import { prisma } from "@/lib/prisma";

export const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export type PickupSlotInfo = {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  active: boolean;
  sortOrder: number;
  label: string;
};

export type PickupInfo = {
  address: string;
  notes: string | null;
  slots: PickupSlotInfo[];
  scheduleLines: string[];
};

export const DEFAULT_PICKUP_INFO: PickupInfo = {
  address: "Av. San Juan 350, CABA",
  notes: "Presentá el código QR del email o tu número de pedido al retirar.",
  slots: [
    {
      id: "default-wed",
      dayOfWeek: 3,
      dayName: "Miércoles",
      startTime: "16:00",
      endTime: "20:00",
      active: true,
      sortOrder: 0,
      label: "Miércoles de 16 a 20 hs",
    },
    {
      id: "default-fri",
      dayOfWeek: 5,
      dayName: "Viernes",
      startTime: "10:00",
      endTime: "16:00",
      active: true,
      sortOrder: 1,
      label: "Viernes de 10 a 16 hs",
    },
  ],
  scheduleLines: ["Miércoles de 16 a 20 hs", "Viernes de 10 a 16 hs"],
};

function formatHour(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const min = parseInt(m ?? "0", 10);
  if (min === 0) return `${hour}`;
  return `${hour}:${String(min).padStart(2, "0")}`;
}

export function formatPickupSlotLabel(
  dayOfWeek: number,
  startTime: string,
  endTime: string
): string {
  const day = DAY_NAMES[dayOfWeek] ?? "Día";
  return `${day} de ${formatHour(startTime)} a ${formatHour(endTime)} hs`;
}

function mapSlot(row: {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
  sortOrder: number;
}): PickupSlotInfo {
  return {
    id: row.id,
    dayOfWeek: row.dayOfWeek,
    dayName: DAY_NAMES[row.dayOfWeek] ?? "Día",
    startTime: row.startTime,
    endTime: row.endTime,
    active: row.active,
    sortOrder: row.sortOrder,
    label: formatPickupSlotLabel(row.dayOfWeek, row.startTime, row.endTime),
  };
}

export function buildPickupInfo(
  address: string,
  notes: string | null,
  slots: PickupSlotInfo[]
): PickupInfo {
  const active = slots.filter((s) => s.active);
  return {
    address,
    notes,
    slots: active,
    scheduleLines: active.map((s) => s.label),
  };
}

export async function getPickupInfo(): Promise<PickupInfo> {
  try {
    let config = await prisma.pickupConfig.findUnique({
      where: { id: "default" },
      include: {
        slots: { orderBy: [{ sortOrder: "asc" }, { dayOfWeek: "asc" }] },
      },
    });

    if (!config) {
      config = await prisma.pickupConfig.create({
        data: {
          id: "default",
          address: DEFAULT_PICKUP_INFO.address,
          notes: DEFAULT_PICKUP_INFO.notes,
          slots: {
            create: DEFAULT_PICKUP_INFO.slots.map((s, i) => ({
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              active: s.active,
              sortOrder: i,
            })),
          },
        },
        include: { slots: { orderBy: [{ sortOrder: "asc" }, { dayOfWeek: "asc" }] } },
      });
    }

    const mapped = config.slots.map(mapSlot);
    if (mapped.length === 0) {
      return { ...DEFAULT_PICKUP_INFO, address: config.address, notes: config.notes };
    }

    return buildPickupInfo(config.address, config.notes, mapped);
  } catch (e) {
    console.error("[pickup] getPickupInfo fallback:", e);
    return DEFAULT_PICKUP_INFO;
  }
}

export function isValidTimeHHmm(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
