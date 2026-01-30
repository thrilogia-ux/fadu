import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  // ILUMINACIÓN
  {
    category: "iluminacion",
    name: "Lámpara colgante industrial",
    description: "Lámpara colgante estilo industrial con pantalla de metal negro. Perfecta para cocinas y comedores.",
    price: 18500,
    compareAtPrice: 22000,
    stock: 15,
    featured: true,
    images: [
      "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800",
    ],
  },
  {
    category: "iluminacion",
    name: "Aplique de pared minimalista",
    description: "Aplique LED de pared con diseño minimalista. Luz cálida, ideal para pasillos.",
    price: 12999,
    stock: 20,
    featured: false,
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    ],
  },
  {
    category: "iluminacion",
    name: "Lámpara de mesa art deco",
    description: "Elegante lámpara de mesa con base de mármol y pantalla de vidrio opalino.",
    price: 34500,
    compareAtPrice: 41000,
    stock: 8,
    featured: true,
    images: [
      "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?w=800",
    ],
  },
  {
    category: "iluminacion",
    name: "Tira LED inteligente 5m",
    description: "Tira LED RGB de 5 metros con control por app. 16 millones de colores.",
    price: 8999,
    stock: 50,
    featured: false,
    images: [
      "https://images.unsplash.com/photo-1615529151169-7b1ff50dc7f2?w=800",
    ],
  },

  // MUEBLES
  {
    category: "muebles",
    name: "Sofá modular 3 cuerpos",
    description: "Sofá modular tapizado en tela bouclé. Configuración flexible para cualquier espacio.",
    price: 289000,
    compareAtPrice: 350000,
    stock: 4,
    featured: true,
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800",
    ],
  },
  {
    category: "muebles",
    name: "Escritorio home office",
    description: "Escritorio de madera con patas metálicas. Incluye pasacables y organizador.",
    price: 75000,
    stock: 12,
    featured: true,
    images: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800",
    ],
  },
  {
    category: "muebles",
    name: "Biblioteca flotante modular",
    description: "Sistema de estantes flotantes modulares. Madera paraíso con terminación natural.",
    price: 42000,
    stock: 18,
    featured: false,
    images: [
      "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800",
    ],
  },
  {
    category: "muebles",
    name: "Sillón individual escandinavo",
    description: "Sillón de un cuerpo con respaldo alto. Patas de roble y tapizado en lino.",
    price: 125000,
    compareAtPrice: 145000,
    stock: 6,
    featured: false,
    images: [
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800",
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800",
    ],
  },
  {
    category: "muebles",
    name: "Mesa ratona nido x3",
    description: "Set de 3 mesas ratonas nido con tapa de vidrio y estructura dorada.",
    price: 55000,
    stock: 10,
    featured: false,
    images: [
      "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800",
    ],
  },

  // DECORACIÓN
  {
    category: "decoracion",
    name: "Espejo circular marco dorado",
    description: "Espejo decorativo circular de 80cm con marco de metal dorado.",
    price: 28500,
    compareAtPrice: 33000,
    stock: 14,
    featured: true,
    images: [
      "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800",
    ],
  },
  {
    category: "decoracion",
    name: "Set macetas geométricas",
    description: "Set de 3 macetas de cemento con formas geométricas. Incluye platos.",
    price: 15800,
    stock: 25,
    featured: false,
    images: [
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800",
    ],
  },
  {
    category: "decoracion",
    name: "Cuadro abstracto grande",
    description: "Cuadro abstracto pintado a mano. Marco de madera flotante. 120x80cm.",
    price: 48000,
    stock: 5,
    featured: true,
    images: [
      "https://images.unsplash.com/photo-1549887534-1541e9326642?w=800",
    ],
  },
  {
    category: "decoracion",
    name: "Alfombra tejida natural",
    description: "Alfombra de yute tejida a mano. 200x300cm. Ideal para living.",
    price: 62000,
    compareAtPrice: 75000,
    stock: 8,
    featured: false,
    images: [
      "https://images.unsplash.com/photo-1600166898405-da9535204843?w=800",
    ],
  },
  {
    category: "decoracion",
    name: "Jarrón cerámico artesanal",
    description: "Jarrón de cerámica hecho a mano con esmalte reactivo único.",
    price: 9500,
    stock: 30,
    featured: false,
    images: [
      "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=800",
    ],
  },

  // HERRAMIENTAS DE DISEÑO
  {
    category: "herramientas-diseno",
    name: "Set escuadras profesional",
    description: "Set de escuadras de acrílico para dibujo técnico. 30, 45 y 60 grados.",
    price: 4500,
    stock: 40,
    featured: false,
    images: [
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800",
    ],
  },
  {
    category: "herramientas-diseno",
    name: "Tablero de dibujo A1",
    description: "Tablero de dibujo profesional tamaño A1 con regla paralela.",
    price: 38000,
    compareAtPrice: 45000,
    stock: 10,
    featured: true,
    images: [
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
    ],
  },
  {
    category: "herramientas-diseno",
    name: "Marcadores arquitectura x24",
    description: "Set de 24 marcadores profesionales para renders y bocetos.",
    price: 18500,
    stock: 35,
    featured: false,
    images: [
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800",
    ],
  },

  // ARQUITECTURA
  {
    category: "arquitectura",
    name: "Maqueta kit básico",
    description: "Kit de materiales para maquetas: cartón, balsa, pegamento y herramientas.",
    price: 12000,
    stock: 20,
    featured: false,
    images: [
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800",
    ],
  },
  {
    category: "arquitectura",
    name: "Escalímetro profesional 30cm",
    description: "Escalímetro triangular de aluminio con 6 escalas diferentes.",
    price: 3200,
    stock: 50,
    featured: false,
    images: [
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
    ],
  },
  {
    category: "arquitectura",
    name: "Plotter A0 impresión",
    description: "Servicio de impresión plotter A0. Papel bond 90g. Por unidad.",
    price: 850,
    stock: 999,
    featured: false,
    images: [
      "https://images.unsplash.com/photo-1581287053822-fd7bf4f4bfec?w=800",
    ],
  },
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Agregando productos de ejemplo...\n");

  for (const p of products) {
    const category = await prisma.category.findUnique({
      where: { slug: p.category },
    });

    if (!category) {
      console.log(`⚠ Categoría no encontrada: ${p.category}`);
      continue;
    }

    const slug = generateSlug(p.name);
    const existing = await prisma.product.findUnique({ where: { slug } });

    if (existing) {
      console.log(`→ Ya existe: ${p.name}`);
      continue;
    }

    await prisma.product.create({
      data: {
        categoryId: category.id,
        name: p.name,
        slug,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice || null,
        stock: p.stock,
        sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        featured: p.featured,
        active: true,
        images: {
          create: p.images.map((url, idx) => ({
            url,
            order: idx,
            isPrimary: idx === 0,
          })),
        },
      },
    });
    console.log(`✓ Creado: ${p.name}`);
  }

  const total = await prisma.product.count();
  console.log(`\n✅ Total de productos en la base: ${total}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
