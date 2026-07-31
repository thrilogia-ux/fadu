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
    { name: "Escritorio", slug: "escritorio", order: 2 },
    { name: "Decoración", slug: "decoracion", order: 3 },
    { name: "Diseño", slug: "diseno", order: 4 },
    { name: "Accesorios", slug: "accesorios", order: 5 },
    { name: "Indumentaria", slug: "indumentaria", order: 6 },
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
  const escritorio = await prisma.category.findUnique({ where: { slug: "escritorio" } });
  if (ilum && escritorio) {
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
        categoryId: escritorio.id,
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
        categoryId: escritorio.id,
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

  // Franja superior (marquesina): IDs fijos; upsert solo crea si no existen (no pisa textos editados en admin)
  const bannerDefaults: { id: string; text: string; order: number }[] = [
    {
      id: "seed_topbanner_pickup",
      text: "Retirás tu compra en el Pickup Point en FADU",
      order: 0,
    },
    {
      id: "seed_topbanner_fadu15",
      text: "Usa el Cupón FADU15 para tener un 15% OFF en tu compra",
      order: 1,
    },
    {
      id: "seed_topbanner_vivi",
      text: "Viví tu identidad FADU en la nueva tienda UBAfadu.shop",
      order: 2,
    },
  ];
  for (const b of bannerDefaults) {
    await prisma.topBannerMessage.upsert({
      where: { id: b.id },
      update: {},
      create: { id: b.id, text: b.text, order: b.order, active: true },
    });
  }
  console.log("Franja superior: mensajes por defecto sincronizados (3)");

  await prisma.pickupConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      address: "Av. San Juan 350, CABA",
      notes: "Presentá el código QR del email o tu número de pedido al retirar.",
      slots: {
        create: [
          { dayOfWeek: 3, startTime: "16:00", endTime: "20:00", active: true, sortOrder: 0 },
          { dayOfWeek: 5, startTime: "10:00", endTime: "16:00", active: true, sortOrder: 1 },
        ],
      },
    },
  });
  console.log("Pickup: horarios por defecto (Mié 16-20, Vie 10-16)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
