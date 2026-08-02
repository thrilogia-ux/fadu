export function isGoogleProfileImage(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.endsWith("googleusercontent.com") || host.endsWith("ggpht.com");
  } catch {
    return false;
  }
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
