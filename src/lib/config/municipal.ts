export const MUNICIPALITIES = [
  { slug: "garcia", name: "García" },
  { slug: "san-nicolas", name: "San Nicolás de los Garza" },
  { slug: "monterrey", name: "Monterrey" },
  { slug: "escobedo", name: "General Escobedo" },
  { slug: "san-pedro", name: "San Pedro Garza García" },
  { slug: "guadalupe", name: "Guadalupe" },
] as const;

export const NEWS_CATEGORIES = [
  { slug: "cultura", name: "Cultura" },
  { slug: "deportes", name: "Deportes" },
  { slug: "comunidad", name: "Comunidad" },
  { slug: "obras-y-servicios", name: "Obras y servicios" },
  { slug: "avisos", name: "Avisos" },
] as const;

export const MUNICIPALITY_SLUGS = ["garcia", "san-nicolas", "monterrey", "escobedo", "san-pedro", "guadalupe"] as const;
export const municipalityName = (slug?: string) => MUNICIPALITIES.find((item) => item.slug === slug)?.name ?? "Zona metropolitana";
export const categoryName = (slug?: string) => NEWS_CATEGORIES.find((item) => item.slug === slug)?.name ?? "Noticias";
