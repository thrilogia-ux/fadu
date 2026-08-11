import { prisma } from "@/lib/prisma";

const KEY = "auth_last_error";

export async function persistAuthError(error: unknown, context?: string) {
  let message: string;
  if (error instanceof Error) {
    const type = "type" in error ? String((error as { type?: string }).type) : error.name;
    message = `[${type}] ${error.message}`;
    if (error.cause && typeof error.cause === "object") {
      message += ` | ${JSON.stringify(error.cause)}`;
    }
  } else {
    message = String(error);
  }
  if (context) message = `${context} → ${message}`;

  const payload = JSON.stringify({ message, at: new Date().toISOString() });

  try {
    await prisma.storeSetting.upsert({
      where: { key: KEY },
      create: { key: KEY, value: payload },
      update: { value: payload },
    });
  } catch (e) {
    console.error("[auth] no se pudo guardar error en DB:", e);
  }
}

export async function getPersistedAuthError(): Promise<{ message: string; at: string } | null> {
  try {
    const row = await prisma.storeSetting.findUnique({ where: { key: KEY } });
    if (!row?.value) return null;
    return JSON.parse(row.value) as { message: string; at: string };
  } catch {
    return null;
  }
}
