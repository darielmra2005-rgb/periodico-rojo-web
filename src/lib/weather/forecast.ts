// Reference points in each municipal seat, not a forecast for every neighbourhood.
export const WEATHER_LOCATIONS = {
  garcia: { name: "García", latitude: 25.81, longitude: -100.59 },
  "san-nicolas": { name: "San Nicolás de los Garza", latitude: 25.75, longitude: -100.30 },
  monterrey: { name: "Monterrey", latitude: 25.68, longitude: -100.32 },
  escobedo: { name: "General Escobedo", latitude: 25.80, longitude: -100.32 },
  "san-pedro": { name: "San Pedro Garza García", latitude: 25.66, longitude: -100.40 },
  guadalupe: { name: "Guadalupe", latitude: 25.68, longitude: -100.26 },
} as const;
export type WeatherMunicipality = keyof typeof WEATHER_LOCATIONS;
export const WEATHER_TIMEZONE = "America/Monterrey";
const HOUR = 3_600_000;

export function isWeatherMunicipality(value: string): value is WeatherMunicipality {
  return Object.hasOwn(WEATHER_LOCATIONS, value);
}

export function localDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: WEATHER_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

type Details = { air_temperature?: number; air_temperature_min?: number; air_temperature_max?: number; precipitation_amount?: number; wind_speed?: number };
type Period = { summary?: { symbol_code?: string }; details?: Details };
type Step = { time: string; data: { instant: { details: Details }; next_1_hours?: Period; next_6_hours?: Period } };
export type MetForecast = { properties: { meta: { updated_at: string }; timeseries: Step[] } };
export type WeatherCondition = { label: string; icon: string };
export type WeatherDay = { date: string; minimum: number; maximum: number; precipitation: number | null; partial: boolean; condition: WeatherCondition };
export type MunicipalForecast = {
  municipality: WeatherMunicipality; name: string; latitude: number; longitude: number;
  updatedAt: string; computedAt: string;
  current: { temperature: number; time: string; wind: number | null; condition: WeatherCondition };
  days: WeatherDay[];
};

export function conditionFor(symbol = ""): WeatherCondition {
  if (symbol.includes("thunder")) return { label: "Tormentas previstas", icon: "⛈" };
  if (symbol.includes("snow") || symbol.includes("sleet")) return { label: "Precipitación invernal", icon: "❄" };
  if (symbol.includes("rain")) return { label: "Lluvia prevista", icon: "🌧" };
  if (symbol.includes("fog")) return { label: "Niebla", icon: "🌫" };
  if (symbol.startsWith("partlycloudy")) return { label: "Parcialmente nublado", icon: "⛅" };
  if (symbol.startsWith("cloudy")) return { label: "Nublado", icon: "☁" };
  if (symbol.startsWith("fair")) return { label: "Poco nublado", icon: symbol.endsWith("night") ? "🌙" : "🌤" };
  if (symbol.startsWith("clearsky")) return { label: symbol.endsWith("night") ? "Despejado" : "Soleado", icon: symbol.endsWith("night") ? "🌙" : "☀" };
  return { label: "Condición no disponible", icon: "—" };
}

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const round = (value: number) => Math.round(value * 10) / 10;

export function summarizeForecast(raw: MetForecast, municipality: WeatherMunicipality, now = new Date()): MunicipalForecast {
  const updated = new Date(raw?.properties?.meta?.updated_at).getTime();
  // Never present old model output as a fresh forecast.
  if (!Number.isFinite(updated) || now.getTime() - updated > 12 * HOUR || updated > now.getTime() + HOUR) throw new Error("Stale or invalid forecast");
  const steps = raw?.properties?.timeseries;
  if (!Array.isArray(steps) || steps.length === 0) throw new Error("Missing forecast");
  const valid = steps.filter((step) => Number.isFinite(Date.parse(step.time)) && finite(step.data?.instant?.details?.air_temperature)).sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  const current = valid.reduce<Step | undefined>((best, step) => !best || Math.abs(Date.parse(step.time) - now.getTime()) < Math.abs(Date.parse(best.time) - now.getTime()) ? step : best, undefined);
  if (!current || Math.abs(Date.parse(current.time) - now.getTime()) > 90 * 60_000) throw new Error("No recent forecast interval");
  const today = localDay(now);
  const groups = new Map<string, { temperatures: number[]; precipitation: number; coveredHours: number; first: number; last: number; symbols: { symbol: string; hour: number; rain: number }[] }>();
  let precipitationEnd = 0;
  for (const step of valid) {
    const start = Date.parse(step.time), date = localDay(new Date(start));
    if (date < today) continue;
    // For today, show only available forecast intervals from the current hour.
    if (start < Math.floor(now.getTime() / HOUR) * HOUR) continue;
    let group = groups.get(date);
    if (!group) { group = { temperatures: [], precipitation: 0, coveredHours: 0, first: start, last: start, symbols: [] }; groups.set(date, group); }
    group.temperatures.push(step.data.instant.details.air_temperature!);
    // Prefer the one-hour period. Adding overlapping six-hour totals would overcount rain.
    const hours = step.data.next_1_hours ? 1 : step.data.next_6_hours ? 6 : 0;
    const period = step.data.next_1_hours ?? step.data.next_6_hours;
    const end = start + hours * HOUR;
    const sameDay = hours > 0 && localDay(new Date(end - 1)) === date;
    if (sameDay && start >= precipitationEnd) {
      if (finite(period?.details?.precipitation_amount) && period.details.precipitation_amount >= 0) {
        group.precipitation += period.details.precipitation_amount;
        group.coveredHours += hours;
        group.last = end;
      }
      precipitationEnd = end;
    }
    const sixHours = step.data.next_6_hours;
    if (sixHours && localDay(new Date(start + 6 * HOUR - 1)) === date) {
      for (const value of [sixHours.details?.air_temperature_min, sixHours.details?.air_temperature_max]) if (finite(value)) group.temperatures.push(value);
    }
    if (period?.summary?.symbol_code) group.symbols.push({ symbol: period.summary.symbol_code, hour: Number(new Intl.DateTimeFormat("en-GB", { timeZone: WEATHER_TIMEZONE, hour: "2-digit", hourCycle: "h23" }).format(new Date(start))), rain: period.details?.precipitation_amount ?? 0 });
  }
  const days: WeatherDay[] = Array.from(groups).slice(0, 7).map(([date, group]) => {
    const storm = group.symbols.find((item) => item.symbol.includes("thunder"));
    const rainy = group.symbols.filter((item) => /rain|snow|sleet/.test(item.symbol)).sort((a, b) => b.rain - a.rain)[0];
    const midday = [...group.symbols].sort((a, b) => Math.abs(a.hour - 12) - Math.abs(b.hour - 12))[0];
    const complete = group.coveredHours === 24;
    const partial = !complete;
    // Missing intervals are not equivalent to zero precipitation.
    const midnight = Date.parse(`${date}T00:00:00-06:00`);
    const expectedStart = Math.max(midnight, Math.floor(now.getTime() / HOUR) * HOUR);
    const expectedEnd = midnight + 24 * HOUR;
    const continuous = group.first === expectedStart && group.last === expectedEnd && group.coveredHours * HOUR === expectedEnd - expectedStart;
    return { date, minimum: round(Math.min(...group.temperatures)), maximum: round(Math.max(...group.temperatures)), precipitation: continuous ? round(group.precipitation) : null, partial, condition: conditionFor((storm ?? rainy ?? midday)?.symbol) };
  });
  if (days.length !== 7 || days[0].date !== today) throw new Error("Incomplete seven-day forecast");
  for (let index = 1; index < days.length; index++) if (Date.parse(days[index].date) - Date.parse(days[index - 1].date) !== 24 * HOUR) throw new Error("Missing forecast day");
  return {
    municipality, ...WEATHER_LOCATIONS[municipality], updatedAt: new Date(updated).toISOString(), computedAt: now.toISOString(),
    current: { temperature: round(current.data.instant.details.air_temperature!), time: current.time, wind: finite(current.data.instant.details.wind_speed) ? round(current.data.instant.details.wind_speed * 3.6) : null, condition: conditionFor((current.data.next_1_hours ?? current.data.next_6_hours)?.summary?.symbol_code) }, days,
  };
}
