let lastAuthError: string | null = null;
let lastAuthErrorAt: string | null = null;

export function setLastAuthError(error: unknown) {
  if (!error) return;
  if (error instanceof Error) {
    lastAuthError = error.message;
    if (error.cause && typeof error.cause === "object") {
      lastAuthError += ` | ${JSON.stringify(error.cause)}`;
    }
  } else {
    lastAuthError = String(error);
  }
  lastAuthErrorAt = new Date().toISOString();
}

export function getLastAuthError() {
  return { message: lastAuthError, at: lastAuthErrorAt };
}
