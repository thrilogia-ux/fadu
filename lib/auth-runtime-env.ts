const STRIPPED_AUTH_ENV_KEYS = [
  "AUTH_URL",
  "NEXTAUTH_URL",
  "AUTH_REDIRECT_PROXY_URL",
] as const;

let strippedAuthEnvKeys: string[] = [];

/**
 * En Vercel suele quedar NEXTAUTH_URL=https://fadustore.vercel.app u otra URL vieja.
 * Eso fuerza callbacks OAuth al dominio incorrecto → error Configuration.
 * Con trustHost, Auth.js usa x-forwarded-host (ubafadu.shop o www).
 */
export function prepareAuthRuntimeEnv() {
  if (process.env.AUTH_TRUST_HOST === "false") return;

  const isDeployed =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  if (!isDeployed) return;

  strippedAuthEnvKeys = [];
  for (const key of STRIPPED_AUTH_ENV_KEYS) {
    if (process.env[key]?.trim()) {
      strippedAuthEnvKeys.push(key);
      delete process.env[key];
    }
  }
}

export function getStrippedAuthEnvKeys() {
  return strippedAuthEnvKeys;
}

export function isAuthUrlIgnoredForOAuth() {
  return strippedAuthEnvKeys.length > 0;
}
