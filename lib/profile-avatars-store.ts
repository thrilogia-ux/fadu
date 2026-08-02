import { prisma } from "@/lib/prisma";

export type ProfileAvatarItem = {
  id: string;
  src: string;
  label: string;
  order: number;
  active: boolean;
};

const STORAGE_KEY = "profile_avatars";

export const DEFAULT_PROFILE_AVATARS: ProfileAvatarItem[] = [
  { id: "fadu-blue", src: "/avatars/fadu-blue.svg", label: "Azul FADU", order: 0, active: true },
  { id: "fadu-indigo", src: "/avatars/fadu-indigo.svg", label: "Índigo", order: 1, active: true },
  { id: "fadu-teal", src: "/avatars/fadu-teal.svg", label: "Verde azulado", order: 2, active: true },
  { id: "fadu-coral", src: "/avatars/fadu-coral.svg", label: "Coral", order: 3, active: true },
  { id: "fadu-amber", src: "/avatars/fadu-amber.svg", label: "Ámbar", order: 4, active: true },
  { id: "fadu-slate", src: "/avatars/fadu-slate.svg", label: "Gris pizarra", order: 5, active: true },
  { id: "fadu-chair", src: "/avatars/fadu-chair.svg", label: "Silla diseño", order: 6, active: true },
  { id: "fadu-grid", src: "/avatars/fadu-grid.svg", label: "Cuadrícula", order: 7, active: true },
];

function normalizeItem(raw: unknown, index: number): ProfileAvatarItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const src = typeof o.src === "string" ? o.src.trim() : "";
  if (!src) return null;
  const id =
    typeof o.id === "string" && o.id.trim()
      ? o.id.trim()
      : `avatar-${index}`;
  const label =
    typeof o.label === "string" && o.label.trim() ? o.label.trim().slice(0, 80) : id;
  const order = typeof o.order === "number" && Number.isFinite(o.order) ? o.order : index;
  const active = o.active !== false;
  return { id, src, label, order, active };
}

export function parseProfileAvatarsJson(raw: string | null | undefined): ProfileAvatarItem[] {
  if (!raw?.trim()) return [...DEFAULT_PROFILE_AVATARS];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_PROFILE_AVATARS];
    const items = parsed
      .map((item, i) => normalizeItem(item, i))
      .filter((x): x is ProfileAvatarItem => x != null);
    return items.length > 0 ? items.sort((a, b) => a.order - b.order) : [...DEFAULT_PROFILE_AVATARS];
  } catch {
    return [...DEFAULT_PROFILE_AVATARS];
  }
}

export async function getProfileAvatars(options?: {
  activeOnly?: boolean;
}): Promise<ProfileAvatarItem[]> {
  const row = await prisma.storeSetting.findUnique({ where: { key: STORAGE_KEY } });
  let items = parseProfileAvatarsJson(row?.value);
  if (!row) {
    await prisma.storeSetting.upsert({
      where: { key: STORAGE_KEY },
      create: {
        key: STORAGE_KEY,
        value: JSON.stringify(DEFAULT_PROFILE_AVATARS),
      },
      update: {},
    });
  }
  if (options?.activeOnly) {
    items = items.filter((a) => a.active);
  }
  return items;
}

export async function saveProfileAvatars(items: ProfileAvatarItem[]): Promise<ProfileAvatarItem[]> {
  const normalized = items
    .map((item, i) => normalizeItem(item, i))
    .filter((x): x is ProfileAvatarItem => x != null)
    .map((item, i) => ({ ...item, order: i }));

  if (normalized.length === 0) {
    throw new Error("Debe haber al menos un avatar");
  }

  await prisma.storeSetting.upsert({
    where: { key: STORAGE_KEY },
    create: { key: STORAGE_KEY, value: JSON.stringify(normalized) },
    update: { value: JSON.stringify(normalized) },
  });

  return normalized;
}

export async function getAllowedProfileAvatarSrcs(): Promise<Set<string>> {
  const items = await getProfileAvatars({ activeOnly: true });
  return new Set(items.map((a) => a.src));
}

export async function isAllowedPresetProfileImage(url: string): Promise<boolean> {
  const allowed = await getAllowedProfileAvatarSrcs();
  return allowed.has(url.trim());
}

export async function isAllowedProfileImage(url: string): Promise<boolean> {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (await isAllowedPresetProfileImage(trimmed)) return true;
  if (isGoogleImageUrl(trimmed)) return true;
  return false;
}

import { isGoogleProfileImage as isGoogleImageUrl } from "@/lib/profile-avatars";
