/** Slugs en `User.fadu_career` para segmentar newsletters y promos. */
export const FADU_CAREER_OPTIONS = [
  { value: "arquitectura", label: "Arquitectura" },
  { value: "diseno_grafico", label: "Diseño Gráfico" },
  { value: "diseno_industrial", label: "Diseño Industrial" },
  { value: "diseno_indumentaria", label: "Diseño de Indumentaria" },
  { value: "diseno_textil", label: "Diseño Textil" },
  { value: "imagen_sonido", label: "Diseño de Imagen y Sonido" },
  {
    value: "planificacion_paisaje",
    label: "Licenciatura en Planificación y Diseño del Paisaje",
  },
  { value: "otra", label: "Otra" },
] as const;

export type FaduCareerSlug = (typeof FADU_CAREER_OPTIONS)[number]["value"];

const ALLOWED = new Set<string>(FADU_CAREER_OPTIONS.map((o) => o.value));

/** true si es un slug de carrera registrado (no acepta string vacío). */
export function isValidFaduCareerSlug(slug: string): slug is FaduCareerSlug {
  return ALLOWED.has(slug);
}

export function faduCareerLabel(slug: string | null | undefined): string {
  if (!slug) return "";
  const o = FADU_CAREER_OPTIONS.find((x) => x.value === slug);
  return o?.label ?? slug;
}
