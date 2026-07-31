import { prisma } from "@/lib/prisma";

export type LegalPageId =
  | "ayuda"
  | "ayuda-comprar"
  | "ayuda-devoluciones"
  | "medios-de-pago"
  | "terminos"
  | "privacidad";

export type LegalPageContent = {
  title: string;
  content: string;
};

export type LegalPageMeta = LegalPageContent & {
  id: LegalPageId;
  path: string;
  description: string;
};

const STORAGE_KEY = "legal_pages";

export const LEGAL_PAGE_META: Record<LegalPageId, Omit<LegalPageMeta, keyof LegalPageContent>> = {
  ayuda: {
    id: "ayuda",
    path: "/ayuda",
    description: "Preguntas frecuentes",
  },
  "ayuda-comprar": {
    id: "ayuda-comprar",
    path: "/ayuda/comprar",
    description: "Cómo comprar",
  },
  "ayuda-devoluciones": {
    id: "ayuda-devoluciones",
    path: "/ayuda/devoluciones",
    description: "Devoluciones y cambios",
  },
  "medios-de-pago": {
    id: "medios-de-pago",
    path: "/medios-de-pago",
    description: "Medios de pago aceptados",
  },
  terminos: {
    id: "terminos",
    path: "/terminos",
    description: "Términos y condiciones",
  },
  privacidad: {
    id: "privacidad",
    path: "/privacidad",
    description: "Política de privacidad",
  },
};

export const LEGAL_PAGE_DEFAULTS: Record<LegalPageId, LegalPageContent> = {
  ayuda: {
    title: "Preguntas frecuentes",
    content: `¿Cómo retiro mi pedido?
Todos los pedidos se retiran en el Pickup Point de FADU (Av. San Juan 350, CABA). Cuando tu compra esté lista, recibirás un email con el código QR y las instrucciones de retiro.

¿Cuánto tarda en estar listo mi pedido?
Los tiempos dependen del stock y la demanda. En general, los pedidos se preparan en 3 a 7 días hábiles. Te avisamos por email cuando puedas retirarlo.

¿Puedo cambiar o cancelar un pedido?
Si el pedido aún no fue preparado, escribinos por WhatsApp con tu número de pedido. Una vez listo para retiro, no es posible modificarlo.

¿Hacen envíos a domicilio?
Por el momento solo ofrecemos retiro en FADU. Consultá la sección Retiro en FADU para ver horarios actualizados.

¿Cómo uso un cupón de descuento?
En el carrito o en el checkout ingresá el código y presioná Aplicar. El descuento se verá reflejado antes de confirmar la compra.`,
  },
  "ayuda-comprar": {
    title: "Cómo comprar",
    content: `1. Elegí tus productos
Navegá el catálogo, seleccioná talle/color si corresponde y agregá al carrito.

2. Creá tu cuenta o iniciá sesión
Para finalizar la compra necesitás una cuenta con email válido.

3. Revisá el carrito
Podés aplicar un cupón de descuento y verificar cantidades antes de ir al checkout.

4. Elegí el medio de pago
Aceptamos Mercado Pago (tarjetas, débito y más) y transferencia bancaria.

5. Retirá en FADU
Cuando el pedido esté listo, te enviamos un email con el código QR. Presentalo en el Pickup Point dentro de los horarios publicados.

¿Tenés dudas? Escribinos por WhatsApp desde el footer del sitio.`,
  },
  "ayuda-devoluciones": {
    title: "Devoluciones y cambios",
    content: `Política general
En UBAfadu.shop trabajamos con productos de diseño y ediciones limitadas. Por eso, las devoluciones se evalúan caso por caso.

Cambios por talle o modelo
Si el producto no fue usado, conserva su embalaje original y el pedido fue retirado hace menos de 7 días, podés solicitar un cambio sujeto a disponibil de stock.

Productos con falla
Si recibiste un producto defectuoso o incorrecto, contactanos dentro de las 48 hs posteriores al retiro con fotos y tu número de pedido.

Reembolsos
Los reembolsos, cuando correspondan, se realizan por el mismo medio de pago utilizado en la compra. El plazo puede demorar según tu banco o Mercado Pago.

Cómo iniciar un reclamo
Escribinos por WhatsApp indicando número de pedido, motivo y fotos si aplica. Nuestro equipo te responderá a la brevedad.

Este texto es orientativo. La política definitiva será publicada por el equipo de FADU.`,
  },
  "medios-de-pago": {
    title: "Medios de pago",
    content: `Mercado Pago (recomendado)
Pagá con tarjetas de crédito y débito, dinero en cuenta de Mercado Pago, y otros medios habilitados en la plataforma.

Transferencia bancaria
Al elegir transferencia, recibirás por email los datos para realizar el pago. Tu pedido queda reservado una vez confirmado el ingreso.

Tarjetas aceptadas (vía Mercado Pago)
Visa, Mastercard, American Express, Cabal, Naranja, Nativa y más, según disponibilidad de Mercado Pago.

Pagos en efectivo
A través de Mercado Pago podés abonar en Rapipago, Pago Fácil y redes habilitadas.

Cupones de descuento
Si tenés un código promocional, ingresalo en el carrito o checkout antes de pagar.

Importante: los precios están expresados en pesos argentinos (ARS).`,
  },
  terminos: {
    title: "Términos y condiciones",
    content: `Última actualización: julio 2026

1. Identificación
UBAfadu.shop es la tienda online de productos de diseño vinculados a la Facultad de Arquitectura, Diseño y Urbanismo (FADU – UBA).

2. Compras
Al realizar un pedido aceptás estos términos, los precios publicados al momento de la compra y la modalidad de retiro en pickup.

3. Precios y stock
Los precios pueden modificarse sin previo aviso. La disponibilidad de stock se confirma al procesar el pedido.

4. Pagos
Los pagos se procesan mediante Mercado Pago o transferencia bancaria según el método elegido en el checkout.

5. Retiro
El comprador es responsable de retirar el pedido en los horarios y el lugar indicados. Pasado un plazo razonable sin retiro, el equipo de FADU podrá contactarte.

6. Propiedad intelectual
Las imágenes, marcas y diseños publicados pertenecen a sus respectivos titulares.

7. Modificaciones
FADU puede actualizar estos términos. La versión vigente estará siempre publicada en esta página.

Texto simulado para fines informativos. Reemplazar con versión legal revisada por el área correspondiente.`,
  },
  privacidad: {
    title: "Política de privacidad",
    content: `Última actualización: julio 2026

1. Datos que recopilamos
Al registrarte o comprar, podemos almacenar nombre, email, teléfono (opcional) e historial de pedidos.

2. Uso de la información
Utilizamos tus datos para procesar pedidos, enviarte confirmaciones, avisos de retiro y responder consultas.

3. Newsletter
Si te suscribís al newsletter, usamos tu email para enviarte novedades. Podés darte de baja en cualquier momento.

4. Cookies y navegación
El sitio puede usar cookies técnicas necesarias para el funcionamiento del carrito y la sesión.

5. Terceros
Compartimos datos únicamente con proveedores necesarios para operar la tienda (por ejemplo, procesamiento de pagos y envío de emails).

6. Seguridad
Aplicamos medidas razonables para proteger tu información. Ningún sistema es 100% infalible.

7. Tus derechos
Podés solicitar acceso, corrección o eliminación de tus datos escribiendo al contacto publicado en el sitio.

8. Contacto
Para consultas sobre privacidad, usá los canales oficiales de UBAfadu.shop.

Texto simulado. Debe ser revisado y adaptado por el responsable legal de FADU antes de producción.`,
  },
};

export const LEGAL_PAGE_IDS = Object.keys(LEGAL_PAGE_DEFAULTS) as LegalPageId[];

function mergePages(stored: Partial<Record<LegalPageId, LegalPageContent>>): Record<LegalPageId, LegalPageContent> {
  const result = { ...LEGAL_PAGE_DEFAULTS };
  for (const id of LEGAL_PAGE_IDS) {
    const page = stored[id];
    if (!page) continue;
    result[id] = {
      title: typeof page.title === "string" && page.title.trim() ? page.title.trim() : result[id].title,
      content:
        typeof page.content === "string" && page.content.trim() ? page.content.trim() : result[id].content,
    };
  }
  return result;
}

export async function getAllLegalPages(): Promise<Record<LegalPageId, LegalPageContent>> {
  try {
    const row = await prisma.storeSetting.findUnique({ where: { key: STORAGE_KEY } });
    if (!row?.value) return { ...LEGAL_PAGE_DEFAULTS };
    const parsed = JSON.parse(row.value) as Partial<Record<LegalPageId, LegalPageContent>>;
    return mergePages(parsed);
  } catch (e) {
    console.error("[legal-pages] getAllLegalPages:", e);
    return { ...LEGAL_PAGE_DEFAULTS };
  }
}

export async function getLegalPage(id: LegalPageId): Promise<LegalPageMeta> {
  const pages = await getAllLegalPages();
  const meta = LEGAL_PAGE_META[id];
  return {
    ...meta,
    ...pages[id],
  };
}

export async function upsertLegalPages(
  updates: Partial<Record<LegalPageId, LegalPageContent>>
): Promise<Record<LegalPageId, LegalPageContent>> {
  const current = await getAllLegalPages();
  const next = mergePages({ ...current, ...updates });

  await prisma.storeSetting.upsert({
    where: { key: STORAGE_KEY },
    update: { value: JSON.stringify(next) },
    create: { key: STORAGE_KEY, value: JSON.stringify(next) },
  });

  return next;
}

export function isLegalPageId(value: string): value is LegalPageId {
  return LEGAL_PAGE_IDS.includes(value as LegalPageId);
}

export function formatLegalContent(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
