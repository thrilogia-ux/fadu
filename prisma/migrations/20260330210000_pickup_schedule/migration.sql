-- Pickup Point: configuración y horarios de retiro editables

CREATE TABLE IF NOT EXISTS "pickup_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "address" TEXT NOT NULL DEFAULT 'Av. San Juan 350, CABA',
    "notes" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pickup_config_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "pickup_slots" (
    "id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL DEFAULT 'default',
    "day_of_week" INTEGER NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pickup_slots_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "pickup_slots"
ADD CONSTRAINT "pickup_slots_config_id_fkey"
FOREIGN KEY ("config_id") REFERENCES "pickup_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "pickup_config" ("id", "address", "notes", "updated_at")
VALUES ('default', 'Av. San Juan 350, CABA', 'Presentá el código QR del email o tu número de pedido al retirar.', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
