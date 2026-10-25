import { localDay, type WeatherPeriod } from "./forecast.ts";

// Describe the amount; do not infer intensity or probability from an accumulation.
export function rainLabel(amount: number | null): string {
  if (amount === null) return "Lluvia: cantidad no disponible";
  if (amount === 0) return "Sin lluvia prevista";
  if (amount < 1) return "Lluvia escasa";
  return "Se prevé lluvia";
}

export function periodsForDay(periods: WeatherPeriod[], date: string, now = new Date()): WeatherPeriod[] {
  const hour = Math.floor(now.getTime() / 3_600_000) * 3_600_000;
  return periods.filter((period) => Date.parse(period.time) >= hour && localDay(new Date(period.time)) === date);
}

export function nearestPeriod(periods: WeatherPeriod[], time: number): number {
  return periods.reduce((best, period, index) => Math.abs(Date.parse(period.time) - time) < Math.abs(Date.parse(periods[best].time) - time) ? index : best, 0);
}
