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
  googleOAuthConfigured: boolean;
  googleClientIdSuffix: string | null;
} {
  const google = getGoogleOAuthEnv();
  const authUrl = process.env.AUTH_URL?.trim() || null;
  return {
    authSecretConfigured: Boolean(process.env.AUTH_SECRET?.trim()),
    authUrl,
    googleOAuthConfigured: google.configured,
    googleClientIdSuffix: google.clientId.includes(".apps.googleusercontent.com")
      ? google.clientId.slice(-28)
      : google.clientId
        ? "(formato inválido)"
        : null,
  };
}
