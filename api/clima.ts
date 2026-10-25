import { isWeatherMunicipality, localDay, summarizeForecast, WEATHER_LOCATIONS, type MetForecast } from "../src/lib/weather/forecast.ts";
import type { IncomingMessage, ServerResponse } from "node:http";

const THREE_HOURS = 3 * 60 * 60 * 1000;
type Cached = { data: MetForecast; expires: number; lastModified: string | null };
const cache = new Map<string, Cached>();
const inFlight = new Map<string, Promise<Cached>>();

async function retrieve(municipality: keyof typeof WEATHER_LOCATIONS): Promise<Cached> {
  const cached = cache.get(municipality);
  if (cached && cached.expires > Date.now()) return cached;
  const pending = inFlight.get(municipality);
  if (pending) return pending;
  const request = (async () => {
    const location = WEATHER_LOCATIONS[municipality];
    const url = new URL("https://api.met.no/weatherapi/locationforecast/2.0/compact");
    url.searchParams.set("lat", String(location.latitude));
    url.searchParams.set("lon", String(location.longitude));
    const headers: Record<string, string> = { "User-Agent": "PeriodicoRojo/1.0 https://periodico-rojo-web.vercel.app/ (https://github.com/darielmra2005-rgb/periodico-rojo-web)", "Accept": "application/json" };
    if (cached?.lastModified) headers["If-Modified-Since"] = cached.lastModified;
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
    if (response.status !== 304 && !response.ok) throw new Error(`Weather provider: ${response.status}`);
    if (response.status === 203) console.warn("MET Norway Locationforecast version deprecated");
    const data: MetForecast = response.status === 304 && cached ? cached.data : await response.json();
    const item = { data, expires: Math.max(Date.now() + THREE_HOURS, Date.parse(response.headers.get("expires") ?? "") || 0), lastModified: response.headers.get("last-modified") ?? cached?.lastModified ?? null };
    cache.set(municipality, item);
    return item;
  })();
  inFlight.set(municipality, request);
  try { return await request; } finally { inFlight.delete(municipality); }
}

export const weatherApi = {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "GET") return Response.json({ error: "Método no permitido." }, { status: 405, headers: { Allow: "GET", "Cache-Control": "no-store" } });
    const url = new URL(request.url);
    const municipality = url.searchParams.get("municipio") ?? "monterrey";
    if (!isWeatherMunicipality(municipality)) return Response.json({ error: "Selecciona un municipio de la cobertura." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    try {
      const { data } = await retrieve(municipality);
      const now = new Date();
      const forecast = summarizeForecast(data, municipality, now);
      // Expire at local midnight too: a cached 'today' must not become yesterday.
      const nextMidnight = Date.parse(`${localDay(now)}T00:00:00-06:00`) + 24 * 60 * 60 * 1000;
      const ttl = Math.max(1, Math.min(10_800, Math.floor((nextMidnight - now.getTime()) / 1000)));
      return Response.json(forecast, { headers: { "Cache-Control": `public, max-age=60, s-maxage=${ttl}`, "X-Content-Type-Options": "nosniff" } });
    } catch (error) {
      console.error("Weather forecast unavailable", error instanceof Error ? error.message : "Unknown error");
      return Response.json({ error: "El pronóstico no está disponible por el momento. Intenta de nuevo más tarde." }, { status: 503, headers: { "Cache-Control": "no-store", "Retry-After": "300" } });
    }
  },
};

// Use the Node request/response entry point supported by Vercel's static builds.
export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const result = await weatherApi.fetch(new Request(new URL(request.url ?? "/api/clima", "https://periodico-rojo-web.vercel.app"), { method: request.method ?? "GET" }));
  response.statusCode = result.status;
  result.headers.forEach((value, name) => response.setHeader(name, value));
  response.end(await result.text());
}
