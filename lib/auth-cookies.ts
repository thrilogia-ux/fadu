/** Host canónico para OAuth (evita cookies PKCE repartidas entre apex y www). */
export function getCanonicalAuthHost(host: string | null): string {
  if (!host) return "www.ubafadu.shop";
  const primary = host.split(",")[0]?.trim() ?? host;
  if (primary === "ubafadu.shop") return "www.ubafadu.shop";
  return primary;
}

export function getAuthCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;
  if (process.env.VERCEL !== "1") return undefined;
  return ".ubafadu.shop";
}

export function getAuthCookiesConfig() {
  const domain = getAuthCookieDomain();
  if (!domain) return undefined;

  const shared = { domain, sameSite: "lax" as const, path: "/" };
  return {
    pkceCodeVerifier: { options: shared },
    callbackUrl: { options: shared },
    sessionToken: { options: shared },
    state: { options: shared },
  };
}
