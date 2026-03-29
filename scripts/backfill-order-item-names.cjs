const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  // Tabla del modelo Product sin @@map → "Product" en PostgreSQL
  await prisma.$executeRawUnsafe(`
    UPDATE order_items o
    SET product_name_snapshot = p.name
    FROM "Product" p
    WHERE o.product_id = p.id
      AND (o.product_name_snapshot IS NULL OR o.product_name_snapshot = '')
  `);
  console.log("Backfill product_name_snapshot listo");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
