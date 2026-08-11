import {
  getStrippedAuthEnvKeys,
  isAuthUrlIgnoredForOAuth,
  prepareAuthRuntimeEnv,
} from "@/lib/auth-runtime-env";

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
  authUrl: string | null;
  nextAuthUrl: string | null;
  authUsesRequestHost: boolean;
  strippedAuthEnvKeys: string[];
  googleOAuthConfigured: boolean;
  googleClientIdSuffix: string | null;
} {
  const google = getGoogleOAuthEnv();
  return {
    authSecretConfigured: Boolean(process.env.AUTH_SECRET?.trim()),
    authUrl: process.env.AUTH_URL?.trim() || null,
    nextAuthUrl: process.env.NEXTAUTH_URL?.trim() || null,
    authUsesRequestHost: isAuthUrlIgnoredForOAuth() || (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL),
    strippedAuthEnvKeys: getStrippedAuthEnvKeys(),
    googleOAuthConfigured: google.configured,
    googleClientIdSuffix: google.clientId.includes(".apps.googleusercontent.com")
      ? google.clientId.slice(-28)
      : google.clientId
        ? "(formato inválido)"
        : null,
  };
}
