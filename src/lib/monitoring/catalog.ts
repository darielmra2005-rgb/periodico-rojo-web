import { z } from "astro/zod";
import { MUNICIPALITY_SLUGS } from "../config/municipal.ts";

const text = z.string().trim().min(1);
const id = z.string().uuid();
const slug = text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "La fecha debe ser un día real en formato AAAA-MM-DD");
const httpsUrl = z.string().url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password && !url.port;
}, "Usa un enlace HTTPS sin credenciales ni puertos alternativos");

export const STAGES = {
  anunciado: "Anuncio documentado",
  solicitud: "Solicitud documentada",
  resolucion: "Resolución documentada",
  "avance-reportado": "Avance reportado",
  "conclusion-reportada": "Conclusión reportada",
  suspendido: "Suspensión documentada",
  cancelado: "Cancelación documentada",
  desconocido: "Estado sin determinar",
} as const;
export const SECTORS = {
  "obras-y-servicios": "Obras y servicios",
  "planeacion-urbana": "Planeación urbana",
  energia: "Energía",
  industria: "Industria",
  logistica: "Logística",
} as const;
export const EVENT_TYPES = {
  anuncio: "Anuncio",
  tramite: "Trámite",
  resolucion: "Resolución",
  avance: "Avance reportado",
  correccion: "Corrección",
} as const;

const sourceSchema = z.object({
  id: slug,
  name: text,
  organization: text,
  portalUrl: httpsUrl,
  allowedHosts: z.array(text.regex(/^[a-z0-9.-]+$/)).min(1),
  coverage: text,
  accessMode: z.literal("manual"),
  accessStatus: z.enum(["comprobado", "pendiente", "no-disponible"]),
  checkedOn: day.nullable(),
  usage: z.object({
    status: z.enum(["pendiente", "verificada"]),
    license: text.nullable(),
    termsUrl: httpsUrl.nullable(),
    note: text,
  }).strict(),
}).strict();

const projectSchema = z.object({
  id,
  slug,
  title: text.max(120),
  description: text.max(300),
  municipality: z.enum(MUNICIPALITY_SLUGS),
  sector: z.enum(["obras-y-servicios", "planeacion-urbana", "energia", "industria", "logistica"]),
  locationDescription: text,
  locationPrecision: z.enum(["municipio", "tramo-descrito", "sitio-verificado"]),
  relatedArticle: z.string().regex(/^\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*$/).nullable(),
  missingInformation: z.array(text).min(1),
  isPublic: z.boolean(),
}).strict();

const evidenceSchema = z.object({
  sourceId: slug,
  url: httpsUrl,
  title: text,
  publishedOn: day.nullable(),
  locator: text,
  supports: z.array(z.enum(["title", "summary", "stage", "occurredOn", "location"])).min(1),
}).strict();

const eventSchema = z.object({
  id,
  projectId: id,
  type: z.enum(["anuncio", "tramite", "resolucion", "avance", "correccion"]),
  stage: z.enum(["anunciado", "solicitud", "resolucion", "avance-reportado", "conclusion-reportada", "suspendido", "cancelado", "desconocido"]),
  title: text.max(120),
  summary: text.max(700),
  basis: z.enum(["declaracion-oficial", "acto-oficial"]),
  occurredOn: day.nullable(),
  recordedOn: day,
  evidence: z.array(evidenceSchema),
  review: z.object({
    status: z.enum(["pendiente", "cotejado"]),
    reviewedOn: day.nullable(),
    reviewer: text.nullable(),
  }).strict(),
  supersedesEventId: id.nullable(),
  isPublic: z.boolean(),
}).strict();

const schema = z.object({
  sources: z.array(sourceSchema),
  projects: z.array(projectSchema),
  events: z.array(eventSchema),
}).strict();
export type Source = z.infer<typeof sourceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ProjectEvent = z.infer<typeof eventSchema>;
export type Catalog = z.infer<typeof schema>;
export type ProjectRecord = { project: Project; events: ProjectEvent[]; latest: ProjectEvent; sources: Source[] };

export function isSourceUrl(url: string, source: Source): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password && !parsed.port && source.allowedHosts.includes(parsed.hostname);
  } catch { return false; }
}

/** Validate the whole catalogue at build time, including foreign keys and evidence. */
export function parseCatalog(input: unknown): Catalog {
  const catalog = schema.parse(input);
  function unique(values: string[], label: string) {
    if (new Set(values).size !== values.length) throw new Error(`${label}: identificadores duplicados`);
  }
  unique(catalog.sources.map((source) => source.id), "Fuentes");
  unique(catalog.projects.map((project) => project.id), "Proyectos");
  unique(catalog.projects.map((project) => project.slug), "Rutas de proyectos");
  unique(catalog.events.map((event) => event.id), "Eventos");
  const sources = new Map(catalog.sources.map((source) => [source.id, source]));
  const projects = new Map(catalog.projects.map((project) => [project.id, project]));
  const events = new Map(catalog.events.map((event) => [event.id, event]));
  for (const source of catalog.sources) {
    if (!isSourceUrl(source.portalUrl, source)) throw new Error(`Portal ajeno a la fuente ${source.id}`);
    if (source.accessStatus === "comprobado" && !source.checkedOn) throw new Error(`Falta fecha de comprobación de ${source.id}`);
    if (source.usage.status === "verificada" && (!source.usage.license || !source.usage.termsUrl)) throw new Error(`Falta respaldo de licencia de ${source.id}`);
  }
  for (const event of catalog.events) {
    if (!projects.has(event.projectId)) throw new Error(`Proyecto desconocido en ${event.id}`);
    for (const evidence of event.evidence) {
      const source = sources.get(evidence.sourceId);
      if (!source || !isSourceUrl(evidence.url, source)) throw new Error(`Fuente o dominio no autorizado en ${event.id}`);
      if (evidence.publishedOn && evidence.publishedOn > event.recordedOn) throw new Error(`La captura antecede al documento en ${event.id}`);
    }
    if (event.review.status === "cotejado") {
      if (!event.review.reviewedOn || !event.review.reviewer || event.review.reviewedOn < event.recordedOn) throw new Error(`Revisión incompleta en ${event.id}`);
      const supported = new Set(event.evidence.flatMap((evidence) => evidence.supports));
      const required = ["title", "summary", "stage", "location", ...(event.occurredOn ? ["occurredOn"] : [])];
      if (!event.evidence.length || required.some((field) => !supported.has(field as typeof event.evidence[number]["supports"][number]))) throw new Error(`Falta evidencia de campos materiales en ${event.id}`);
    }
    if (event.type === "anuncio" && event.stage !== "anunciado") throw new Error(`Un anuncio no acredita otra etapa en ${event.id}`);
    if (event.type === "tramite" && event.stage !== "solicitud") throw new Error(`Un trámite no acredita resolución en ${event.id}`);
    if (["solicitud", "resolucion", "suspendido", "cancelado"].includes(event.stage) && event.basis !== "acto-oficial") throw new Error(`La etapa requiere un acto original en ${event.id}`);
    if ((event.type === "correccion") !== Boolean(event.supersedesEventId)) throw new Error(`Una corrección debe identificar el evento anterior en ${event.id}`);
    if (event.supersedesEventId) {
      const previous = events.get(event.supersedesEventId);
      if (!previous || previous.projectId !== event.projectId || previous.recordedOn > event.recordedOn || previous.id === event.id) throw new Error(`Corrección inválida en ${event.id}`);
      const seen = new Set([event.id]);
      let current: ProjectEvent | undefined = previous;
      while (current) {
        if (seen.has(current.id)) throw new Error(`Ciclo de correcciones en ${event.id}`);
        seen.add(current.id);
        current = current.supersedesEventId ? events.get(current.supersedesEventId) : undefined;
      }
    }
  }
  return catalog;
}

export function mexicoDay(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function sourceDate(event: ProjectEvent): string | null {
  return event.evidence.map((item) => item.publishedOn).filter((date): date is string => Boolean(date)).sort().at(-1) ?? null;
}

export function formatDay(value: string | null): string {
  return value ? new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)) : "Sin fecha precisa en la evidencia";
}

/** The public projection is shared by list, detail, counts and source pages. */
export function publishedRecords(catalog: Catalog, asOf = mexicoDay()): ProjectRecord[] {
  const sourceMap = new Map(catalog.sources.map((source) => [source.id, source]));
  return catalog.projects.filter((project) => project.isPublic).flatMap((project) => {
    const events = catalog.events.filter((event) => event.projectId === project.id && event.isPublic && event.review.status === "cotejado" && Boolean(event.review.reviewedOn && event.review.reviewedOn <= asOf) && event.recordedOn <= asOf && event.evidence.length > 0);
    if (!events.length) return [];
    const superseded = new Set(events.map((event) => event.supersedesEventId).filter(Boolean));
    const order = (a: ProjectEvent, b: ProjectEvent) => (sourceDate(b) ?? b.recordedOn).localeCompare(sourceDate(a) ?? a.recordedOn) || b.recordedOn.localeCompare(a.recordedOn) || a.id.localeCompare(b.id);
    const latest = events.filter((event) => !superseded.has(event.id)).sort(order)[0];
    const sourceIds = new Set(events.flatMap((event) => event.evidence.map((item) => item.sourceId)));
    return [{ project, events: events.sort(order), latest, sources: [...sourceIds].map((id) => sourceMap.get(id)!) }];
  }).sort((a, b) => (sourceDate(b.latest) ?? b.latest.recordedOn).localeCompare(sourceDate(a.latest) ?? a.latest.recordedOn) || a.project.slug.localeCompare(b.project.slug));
}
