import {
  parseStreetAndNumber,
  resolveEnviopackProvinceId,
  splitRecipientName,
} from "@/lib/shipping-provinces";
import type { ShippingAddress } from "@/lib/shipping-zones";
import type { ShippingPackageSummary } from "@/lib/shipping-packages";

const API_BASE = "https://api.enviopack.com";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
};

let tokenCache: TokenCache | null = null;

export type EnviopackConfig = {
  apiKey: string;
  secretKey: string;
  direccionEnvioId: number | null;
};

export function getEnviopackConfigFromEnv(): EnviopackConfig | null {
  const apiKey = process.env.ENVOIPACK_API_KEY?.trim();
  const secretKey = process.env.ENVOIPACK_SECRET_KEY?.trim();
  if (!apiKey || !secretKey) return null;

  const depRaw = process.env.ENVOIPACK_DIRECCION_ENVIO_ID?.trim();
  const direccionEnvioId =
    depRaw && Number.isFinite(Number(depRaw)) ? Number(depRaw) : null;

  return { apiKey, secretKey, direccionEnvioId };
}

export function isEnviopackConfigured(): boolean {
  return getEnviopackConfigFromEnv() != null;
}

async function fetchAccessToken(config: EnviopackConfig): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }

  if (tokenCache?.refreshToken) {
    try {
      const refreshRes = await fetch(
        `${API_BASE}/token/refresh?refresh_token=${encodeURIComponent(tokenCache.refreshToken)}`,
        { method: "POST" }
      );
      if (refreshRes.ok) {
        const data = (await refreshRes.json()) as {
          access_token?: string;
          refresh_token?: string;
          expires_in?: number;
        };
        if (data.access_token) {
          tokenCache = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token ?? tokenCache.refreshToken,
            expiresAt: Date.now() + (data.expires_in ?? 14_400) * 1000,
          };
          return data.access_token;
        }
      }
    } catch {
      /* full auth below */
    }
  }

  const body = new URLSearchParams({
    "api-key": config.apiKey,
    "secret-key": config.secretKey,
  });

  const res = await fetch(`${API_BASE}/auth`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Enviopack auth failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!data.access_token) {
    throw new Error("Enviopack auth: respuesta sin access_token");
  }

  tokenCache = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 14_400) * 1000,
  };

  return data.access_token;
}

async function enviopackGet<T>(
  path: string,
  params: Record<string, string | number | undefined>
): Promise<T> {
  const config = getEnviopackConfigFromEnv();
  if (!config) throw new Error("Enviopack no configurado");

  const token = await fetchAccessToken(config);
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Enviopack GET ${path} (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

async function enviopackPost<T>(path: string, body: unknown): Promise<T> {
  const config = getEnviopackConfigFromEnv();
  if (!config) throw new Error("Enviopack no configurado");

  const token = await fetchAccessToken(config);
  const url = `${API_BASE}${path}?access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Enviopack POST ${path} (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

export type EnviopackQuoteOption = {
  id: string;
  label: string;
  price: number;
  servicio: string;
  modalidad: string;
  horasEntrega: number | null;
  estimatedDays: string;
};

type EnviopackPriceRow = {
  modalidad?: string;
  servicio?: string;
  valor?: string | number;
  horas_entrega?: number;
};

const SERVICE_LABELS: Record<string, string> = {
  N: "Estándar",
  P: "Prioritario",
  X: "Express",
  R: "Devolución",
};

function formatEstimatedDays(hours: number | null | undefined): string {
  if (!hours || hours <= 0) return "Plazo a confirmar";
  if (hours <= 48) return "1 a 2 días hábiles";
  if (hours <= 96) return "3 a 5 días hábiles";
  if (hours <= 168) return "5 a 7 días hábiles";
  return "7 a 12 días hábiles";
}

export async function quoteEnviopackHomeDelivery(input: {
  postalCode: string;
  state: string;
  packageSummary: ShippingPackageSummary;
  direccionEnvioId?: number | null;
}): Promise<EnviopackQuoteOption[]> {
  const config = getEnviopackConfigFromEnv();
  if (!config) return [];

  const provincia = resolveEnviopackProvinceId(input.state, input.postalCode);
  const cp = input.postalCode.replace(/\D/g, "").slice(0, 4);
  if (cp.length < 4) return [];

  const params: Record<string, string | number | undefined> = {
    provincia,
    codigo_postal: cp,
    peso: input.packageSummary.totalWeightKg,
    paquetes: input.packageSummary.paquetesParam,
  };

  const depId = input.direccionEnvioId ?? config.direccionEnvioId;
  if (depId != null) params.direccion_envio = depId;

  const rows = await enviopackGet<EnviopackPriceRow[]>("/cotizar/precio/a-domicilio", params);

  if (!Array.isArray(rows) || rows.length === 0) return [];

  return rows
    .map((row) => {
      const servicio = row.servicio ?? "N";
      const modalidad = row.modalidad ?? "D";
      const price = Math.round(Number(row.valor));
      if (!Number.isFinite(price) || price < 0) return null;
      const horas = row.horas_entrega ?? null;
      const svcLabel = SERVICE_LABELS[servicio] ?? servicio;
      return {
        id: `ep-${servicio}-${modalidad}`,
        label: `Envío ${svcLabel.toLowerCase()} a domicilio`,
        price,
        servicio,
        modalidad,
        horasEntrega: horas,
        estimatedDays: formatEstimatedDays(horas),
      } satisfies EnviopackQuoteOption;
    })
    .filter((o): o is EnviopackQuoteOption => o != null)
    .sort((a, b) => a.price - b.price);
}

export type EnviopackPedido = { id: number; id_externo?: string };

export async function createEnviopackPedido(input: {
  orderId: string;
  recipientName: string;
  email: string;
  phone?: string | null;
  total: number;
  paid: boolean;
  provincia: string;
  localidad: string;
}): Promise<EnviopackPedido> {
  const { nombre, apellido } = splitRecipientName(input.recipientName);
  const now = new Date();
  const fecha = now.toISOString().slice(0, 19).replace("T", " ");

  return enviopackPost<EnviopackPedido>("/pedidos", {
    id_externo: input.orderId.slice(0, 30),
    nombre,
    apellido,
    email: input.email.slice(0, 100),
    telefono: input.phone?.slice(0, 30) ?? undefined,
    monto: input.total,
    fecha_alta: fecha,
    pagado: input.paid,
    provincia: input.provincia,
    localidad: input.localidad.slice(0, 50),
  });
}

export type EnviopackEnvio = {
  id: number;
  tracking_number?: string | null;
  estado?: string;
};

export async function createEnviopackEnvio(input: {
  pedidoId: number;
  address: ShippingAddress;
  packageSummary: ShippingPackageSummary;
  servicio: string;
  modalidad: string;
  correo?: string | null;
  direccionEnvioId?: number | null;
  confirmado?: boolean;
}): Promise<EnviopackEnvio> {
  const config = getEnviopackConfigFromEnv();
  if (!config) throw new Error("Enviopack no configurado");

  const provincia = resolveEnviopackProvinceId(input.address.state, input.address.postalCode);
  const { calle, numero } = parseStreetAndNumber(
    input.address.streetNumber
      ? `${input.address.street} ${input.address.streetNumber}`.trim()
      : input.address.street
  );

  const paquetes = input.packageSummary.packages.map((p) => ({
    alto: p.alto,
    ancho: p.ancho,
    largo: p.largo,
    peso: p.peso,
    descripcion_primera_linea: "Pedido FADU",
    descripcion_segunda_linea: input.address.city.slice(0, 50),
  }));

  const depId = input.direccionEnvioId ?? config.direccionEnvioId;

  return enviopackPost<EnviopackEnvio>("/envios", {
    pedido: input.pedidoId,
    direccion_envio: depId ?? undefined,
    destinatario: input.address.recipientName.slice(0, 50),
    observaciones: input.address.notes?.slice(0, 200) ?? undefined,
    modalidad: input.modalidad,
    servicio: input.servicio,
    correo: input.correo ?? undefined,
    confirmado: input.confirmado ?? true,
    despacho: "D",
    paquetes,
    calle,
    numero,
    piso: input.address.floor?.slice(0, 6) ?? undefined,
    depto: input.address.apartment?.slice(0, 4) ?? undefined,
    codigo_postal: input.address.postalCode.replace(/\D/g, "").slice(0, 4),
    provincia,
    localidad: input.address.city.slice(0, 50),
  });
}

export async function getEnviopackLabelPdf(envioId: number): Promise<ArrayBuffer> {
  const config = getEnviopackConfigFromEnv();
  if (!config) throw new Error("Enviopack no configurado");

  const token = await fetchAccessToken(config);
  const url = `${API_BASE}/envios/${envioId}/etiqueta?access_token=${encodeURIComponent(token)}&formato=pdf`;

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`No se pudo obtener etiqueta (${res.status})`);
  }
  return res.arrayBuffer();
}

export async function getEnviopackTracking(envioId: number): Promise<{ fecha: string; mensaje: string }[]> {
  return enviopackGet<{ fecha: string; mensaje: string }[]>(`/envios/${envioId}/tracking`, {});
}
