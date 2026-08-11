-- WhatsApp opt-in en perfil/checkout (requerido para OAuth / Prisma User)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "whatsapp_notify" BOOLEAN NOT NULL DEFAULT false;
