import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const cols = await prisma.$queryRaw`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'discount_total'
  `;
  console.log("discount_total:", cols);
} catch (e) {
  console.error("Error:", e.message);
} finally {
  await prisma.$disconnect();
}
