/** Mensajes legibles para errores de Auth.js en /login?error=... */
export function authErrorMessage(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "Configuration":
      return "Error al volver de Google. Probá desde https://www.ubafadu.shop/login en incógnito. Si persiste, abrí /api/health y mandame el campo lastAuthError.";
    case "InvalidCheck":
      return "La sesión de Google expiró o las cookies se perdieron. Cerrá pestañas, abrí incógnito y entrá por www.ubafadu.shop/login.";
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
