// Verified municipal portals. Adding another source requires an editorial review;
// a generic .gob.mx suffix or a social-media verification badge is not sufficient.
export const OFFICIAL_SOURCES = {
  garcia: { name: "Gobierno de García", hostname: "garcia.gob.mx", portal: "https://garcia.gob.mx/" },
  "san-nicolas": { name: "Gobierno de San Nicolás de los Garza", hostname: "sanicolas.gob.mx", portal: "https://sanicolas.gob.mx/sitio_oficial_pc" },
  monterrey: { name: "Gobierno de Monterrey", hostname: "monterrey.gob.mx", portal: "https://www.monterrey.gob.mx/noticias/" },
  escobedo: { name: "Gobierno de General Escobedo", hostname: "escobedo.gob.mx", portal: "https://escobedo.gob.mx/?p=notas" },
  "san-pedro": { name: "Gobierno de San Pedro Garza García", hostname: "sanpedro.gob.mx", portal: "https://www.sanpedro.gob.mx/" },
  guadalupe: { name: "Gobierno de Guadalupe", hostname: "guadalupe.gob.mx", portal: "https://guadalupe.gob.mx/" },
} as const;

export function isOfficialSource(sourceUrl: string | undefined, municipality: string | undefined): boolean {
  if (!sourceUrl || !municipality || !Object.hasOwn(OFFICIAL_SOURCES, municipality)) return false;
  try {
    const url = new URL(sourceUrl);
    const source = OFFICIAL_SOURCES[municipality as keyof typeof OFFICIAL_SOURCES];
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    return url.protocol === "https:" && !url.username && !url.password && !url.port && hostname === source.hostname;
  } catch {
    return false;
  }
}
