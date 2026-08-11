let authUrlIgnoredForOAuth = false;

/**
 * AUTH_URL fijo (p. ej. https://www.ubafadu.shop) fuerza callbacks OAuth a www
 * aunque el usuario entre por ubafadu.shop → error Configuration.
 * Con trustHost, Auth.js infiere el host de cada request (www o apex).
 */
export function prepareAuthRuntimeEnv() {
  if (process.env.AUTH_TRUST_HOST === "false") return;

  const isDeployed =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  if (isDeployed && process.env.AUTH_URL?.trim()) {
    authUrlIgnoredForOAuth = true;
    delete process.env.AUTH_URL;
  }
}

export function isAuthUrlIgnoredForOAuth() {
  return authUrlIgnoredForOAuth;
}
