/** Mensajes legibles para errores de Auth.js en /login?error=... */
export function authErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "Configuration":
      return "Error al volver de Google. Revisá GOOGLE_CLIENT_SECRET en Vercel (debe coincidir con el Client ID en Google Cloud) y borrá AUTH_URL. Después de cambiar variables, hacé redeploy.";
    case "OAuthCallback":
    case "OAuthSignin":
      return "Google rechazó el inicio de sesión. Revisá que GOOGLE_CLIENT_SECRET coincida con Google Cloud.";
    case "OAuthAccountNotLinked":
      return "Ya tenés una cuenta con ese email usando otro método de ingreso.";
    case "AccessDenied":
      return "Acceso denegado. Si la app está en prueba en Google, agregá tu email en Usuarios de prueba.";
    case "Verification":
      return "El enlace de verificación expiró o no es válido.";
    default:
      return "No se pudo iniciar sesión con Google. Intentá de nuevo.";
  }
}

export function isWeakAuthSecret(secret: string | undefined): boolean {
  const value = secret?.trim() ?? "";
  if (!value) return true;
  if (value.length < 32) return true;
  return /dev-secret|cambiar-en-produccion|changeme|example|test/i.test(value);
}
