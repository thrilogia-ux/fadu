import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin user (credenciales: admin@fadustore.com / admin123)
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@fadustore.com" },
    update: {},
    create: {
      email: "admin@fadustore.com",
      passwordHash: adminHash,
      name: "Admin Fadu",
      role: "admin",
    },
  });
  console.log("Admin user:", admin.email);

  // Categorías iniciales (administrables desde panel después)
  const categories = [
    { name: "Iluminación", slug: "iluminacion", order: 1 },
    { name: "Muebles", slug: "muebles", order: 2 },
    { name: "Decoración", slug: "decoracion", order: 3 },
    { name: "Herramientas de diseño", slug: "herramientas-diseno", order: 4 },
    { name: "Arquitectura", slug: "arquitectura", order: 5 },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, order: c.order },
      create: c,
    });
  }
  console.log("Categorías creadas:", categories.length);

  // Productos de prueba
  const ilum = await prisma.category.findUnique({ where: { slug: "iluminacion" } });
  const muebles = await prisma.category.findUnique({ where: { slug: "muebles" } });
  if (ilum && muebles) {
    await prisma.product.upsert({
      where: { slug: "lampara-diseno-nordico" },
      update: {},
      create: {
        categoryId: ilum.id,
        name: "Lámpara de diseño nórdico",
        slug: "lampara-diseno-nordico",
        description: "Lámpara de pie con estilo minimalista. Ideal para living o estudio.",
        price: 24999,
        compareAtPrice: 29999,
        stock: 10,
        sku: "LAMP-001",
        featured: true,
        active: true,
        images: {
          create: [
            { url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800", order: 0, isPrimary: true },
          ],
        },
      },
    });
    await prisma.product.upsert({
      where: { slug: "silla-eames-replica" },
      update: {},
      create: {
        categoryId: muebles.id,
        name: "Silla Eames estilo",
        slug: "silla-eames-replica",
        description: "Silla de comedor con inspiración Eames. Madera y estructura metálica.",
        price: 45999,
        stock: 5,
        sku: "SILLA-002",
        featured: true,
        active: true,
        images: {
          create: [
            { url: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800", order: 0, isPrimary: true },
          ],
        },
      },
    });
    await prisma.product.upsert({
      where: { slug: "mesa-centro-marmol" },
      update: {},
      create: {
        categoryId: muebles.id,
        name: "Mesa de centro mármol",
        slug: "mesa-centro-marmol",
        description: "Mesa de centro con tapa de mármol y base de metal.",
        price: 68999,
        compareAtPrice: 79999,
        stock: 3,
        sku: "MESA-003",
        featured: false,
        active: true,
        images: {
          create: [
            { url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800", order: 0, isPrimary: true },
          ],
        },
      },
    });
    console.log("Productos de prueba creados: 3");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
