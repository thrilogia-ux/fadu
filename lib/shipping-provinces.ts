/** IDs provincia Enviopack (ISO 3166-2:AR sin prefijo AR-) */
export const ENVIOPACK_PROVINCE_IDS: Record<string, string> = {
  C: "C",
  caba: "C",
  "ciudad autónoma de buenos aires": "C",
  "ciudad autonoma de buenos aires": "C",
  "capital federal": "C",
  "capital federal (caba)": "C",
  B: "B",
  "buenos aires": "B",
  "provincia de buenos aires": "B",
  pba: "B",
  gba: "B",
  K: "K",
  catamarca: "K",
  H: "H",
  chaco: "H",
  U: "U",
  chubut: "U",
  X: "X",
  córdoba: "X",
  cordoba: "X",
  W: "W",
  corrientes: "W",
  E: "E",
  "entre ríos": "E",
  "entre rios": "E",
  P: "P",
  formosa: "P",
  Y: "Y",
  jujuy: "Y",
  L: "L",
  "la pampa": "L",
  F: "F",
  "la rioja": "F",
  M: "M",
  mendoza: "M",
  N: "N",
  misiones: "N",
  Q: "Q",
  neuquén: "Q",
  neuquen: "Q",
  R: "R",
  "río negro": "R",
  A: "A",
  salta: "A",
  J: "J",
  "san juan": "J",
  D: "D",
  "san luis": "D",
  Z: "Z",
  "santa cruz": "Z",
  S: "S",
  "santa fe": "S",
  G: "G",
  "santiago del estero": "G",
  V: "V",
  "tierra del fuego": "V",
  T: "T",
  tucumán: "T",
  tucuman: "T",
};

/** Inferir provincia Enviopack por CP (prefijos comunes). */
export function inferProvinceIdFromPostalCode(postalCode: string): string | null {
  const cp = postalCode.trim().replace(/\D/g, "");
  if (cp.length < 4) return null;
  const prefix2 = cp.slice(0, 2);
  if (["10", "11", "12", "13", "14"].includes(prefix2)) return "C";
  if (["15", "16", "17", "18", "19"].includes(prefix2)) return "B";
  return null;
}

export function resolveEnviopackProvinceId(state: string, postalCode: string): string {
  const normalized = state.trim().toLowerCase();
  if (normalized && ENVIOPACK_PROVINCE_IDS[normalized]) {
    return ENVIOPACK_PROVINCE_IDS[normalized];
  }
  if (normalized.includes("caba") || normalized.includes("capital")) return "C";
  if (normalized.includes("buenos aires")) return "B";

  const fromCp = inferProvinceIdFromPostalCode(postalCode);
  if (fromCp) return fromCp;

  return "C";
}

export function splitRecipientName(fullName: string): { nombre: string; apellido: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { nombre: "Cliente", apellido: "FADU" };
  if (parts.length === 1) return { nombre: parts[0].slice(0, 30), apellido: "-" };
  return {
    nombre: parts[0].slice(0, 30),
    apellido: parts.slice(1).join(" ").slice(0, 30),
  };
}

export function parseStreetAndNumber(streetRaw: string): { calle: string; numero: string } {
  const trimmed = streetRaw.trim();
  const match = trimmed.match(/^(.+?)\s+(\d+\w*)\s*$/);
  if (match) {
    return { calle: match[1].trim().slice(0, 50), numero: match[2].slice(0, 5) };
  }
  return { calle: trimmed.slice(0, 50) || "Sin calle", numero: "S/N" };
}
