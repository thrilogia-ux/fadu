import {
  getStrippedAuthEnvKeys,
  isAuthUrlIgnoredForOAuth,
  prepareAuthRuntimeEnv,
} from "@/lib/auth-runtime-env";
import { isWeakAuthSecret } from "@/lib/auth-errors";

prepareAuthRuntimeEnv();

/** Lee credenciales Google OAuth sin espacios ni comillas accidentales. */
export function getGoogleOAuthEnv(): {
  clientId: string;
  clientSecret: string;
  configured: boolean;
} {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim().replace(/^["']|["']$/g, "") ?? "";
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET?.trim().replace(/^["']|["']$/g, "") ?? "";
  return {
    clientId,
    clientSecret,
    configured: clientId.length > 0 && clientSecret.length > 0,
  };
}

export function getAuthEnvStatus(): {
  authSecretConfigured: boolean;
  authSecretWeak: boolean;
  authUrl: string | null;
  nextAuthUrl: string | null;
  authUsesRequestHost: boolean;
  strippedAuthEnvKeys: string[];
  googleOAuthConfigured: boolean;
  googleClientIdPrefix: string | null;
  googleClientIdSuffix: string | null;
  googleClientSecretFormat: "ok" | "invalid" | "missing";
} {
  const google = getGoogleOAuthEnv();
  const authSecret = process.env.AUTH_SECRET?.trim() ?? "";
  const secret = google.clientSecret;
  return {
    authSecretConfigured: Boolean(authSecret),
    authSecretWeak: isWeakAuthSecret(authSecret),
    authUrl: process.env.AUTH_URL?.trim() || null,
    nextAuthUrl: process.env.NEXTAUTH_URL?.trim() || null,
    authUsesRequestHost: isAuthUrlIgnoredForOAuth() || (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL),
    strippedAuthEnvKeys: getStrippedAuthEnvKeys(),
    googleOAuthConfigured: google.configured,
    googleClientIdPrefix: google.clientId
      ? google.clientId.slice(0, 20)
      : null,
    googleClientIdSuffix: google.clientId.includes(".apps.googleusercontent.com")
      ? google.clientId.slice(-28)
      : google.clientId
        ? "(formato inválido)"
        : null,
    googleClientSecretFormat: !secret
      ? "missing"
      : secret.startsWith("GOCSPX-") && secret.length >= 20
        ? "ok"
        : "invalid",
  };
}
