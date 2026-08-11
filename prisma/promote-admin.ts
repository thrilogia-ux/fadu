import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] ?? "thrilogia@gmail.com";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    console.log(`NOT_FOUND: ${email}`);
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { email: true, name: true },
    });
    console.log("ADMINS:", admins);
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: "admin" },
    select: { email: true, name: true, role: true },
  });
  console.log("UPDATED:", updated);

  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { email: true, name: true },
  });
  console.log("ALL_ADMINS:", admins);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
