/** Avatares preset (rutas locales). El campo `User.image` también acepta fotos de Google OAuth. */
export const PROFILE_AVATARS = [
  { id: "fadu-blue", src: "/avatars/fadu-blue.svg", label: "Azul FADU" },
  { id: "fadu-indigo", src: "/avatars/fadu-indigo.svg", label: "Índigo" },
  { id: "fadu-teal", src: "/avatars/fadu-teal.svg", label: "Verde azulado" },
  { id: "fadu-coral", src: "/avatars/fadu-coral.svg", label: "Coral" },
  { id: "fadu-amber", src: "/avatars/fadu-amber.svg", label: "Ámbar" },
  { id: "fadu-slate", src: "/avatars/fadu-slate.svg", label: "Gris pizarra" },
  { id: "fadu-chair", src: "/avatars/fadu-chair.svg", label: "Silla diseño" },
  { id: "fadu-grid", src: "/avatars/fadu-grid.svg", label: "Cuadrícula" },
] as const;

const PRESET_SRCS = new Set<string>(PROFILE_AVATARS.map((a) => a.src));

export function isGoogleProfileImage(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.endsWith("googleusercontent.com") || host.endsWith("ggpht.com");
  } catch {
    return false;
  }
}

export function isAllowedProfileImage(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (PRESET_SRCS.has(trimmed)) return true;
  if (isGoogleProfileImage(trimmed)) return true;
  return false;
}

export function userInitials(name: string | null | undefined, email?: string | null): string {
  const fromName = name?.trim();
  if (fromName) {
    const parts = fromName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fromName.slice(0, 2).toUpperCase();
  }
  const mail = email?.trim();
  if (mail) return mail.charAt(0).toUpperCase();
  return "?";
}
