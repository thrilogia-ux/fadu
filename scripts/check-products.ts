import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.product.count();
    console.log("prisma.product.count:", count);

    const rows = await prisma.product.findMany({ take: 2, select: { id: true, name: true, active: true } });
    console.log("sample:", rows);

    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename ILIKE '%product%'
    `;
    console.log("tables:", tables);
  } catch (e) {
    console.error("error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
