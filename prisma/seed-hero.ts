import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creando slides de ejemplo...");

  // Eliminar slides existentes
  await prisma.heroSlide.deleteMany();

  // Crear slides de ejemplo
  const slides = [
    {
      title: "Nueva colección 2026",
      subtitle: "Descubrí los mejores productos de diseño y arquitectura para transformar tu espacio",
      buttonText: "Ver productos",
      buttonLink: "/categoria/iluminacion",
      imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80",
      order: 0,
      active: true,
    },
    {
      title: "Iluminación de diseño",
      subtitle: "Lámparas y luminarias exclusivas para crear ambientes únicos",
      buttonText: "Explorar",
      buttonLink: "/categoria/iluminacion",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80",
      order: 1,
      active: true,
    },
    {
      title: "Muebles con estilo",
      subtitle: "Piezas únicas que combinan funcionalidad y diseño contemporáneo",
      buttonText: "Ver muebles",
      buttonLink: "/categoria/muebles",
      imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&q=80",
      order: 2,
      active: true,
    },
    {
      title: "Hasta 40% OFF",
      subtitle: "Ofertas especiales en productos seleccionados. ¡No te las pierdas!",
      buttonText: "Ver ofertas",
      buttonLink: "/ofertas",
      imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&q=80",
      order: 3,
      active: true,
    },
  ];

  for (const slide of slides) {
    await prisma.heroSlide.create({ data: slide });
  }

  console.log(`✅ ${slides.length} slides creados`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
