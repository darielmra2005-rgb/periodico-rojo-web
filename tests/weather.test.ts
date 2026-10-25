import { test } from "node:test";
import assert from "node:assert/strict";
import { conditionFor, isWeatherMunicipality, localDay, summarizeForecast, WEATHER_LOCATIONS, type MetForecast } from "../src/lib/weather/forecast.ts";
import handler, { weatherApi } from "../api/clima.ts";
import type { IncomingMessage, ServerResponse } from "node:http";

const HOUR = 3_600_000;
const now = new Date("2026-10-25T01:30:00Z"); // Still October 24 in Nuevo León.
function fixture(): MetForecast {
  return { properties: { meta: { updated_at: "2026-10-25T01:00:00Z" }, timeseries: Array.from({ length: 200 }, (_, index) => ({
    time: new Date(Date.parse("2026-10-25T01:00:00Z") + index * HOUR).toISOString(),
    data: { instant: { details: { air_temperature: 20 + index % 5, wind_speed: 2 } }, next_1_hours: { summary: { symbol_code: "clearsky_night" }, details: { precipitation_amount: 1 } }, next_6_hours: { summary: { symbol_code: "rain" }, details: { precipitation_amount: 6, air_temperature_min: 18, air_temperature_max: 26 } } },
  })) } };
}

test("six distinct municipal reference points; arbitrary coordinates and inherited keys are rejected", () => {
  assert.equal(Object.keys(WEATHER_LOCATIONS).length, 6);
  assert.equal(new Set(Object.values(WEATHER_LOCATIONS).map((point) => `${point.latitude},${point.longitude}`)).size, 6);
  assert.equal(isWeatherMunicipality("garcia"), true);
  for (const value of ["toString", "__proto__", "unknown", "25.6,-100.3"]) assert.equal(isWeatherMunicipality(value), false);
});

test("today and seven days use Nuevo León's date, including the UTC midnight boundary", () => {
  assert.equal(localDay(now), "2026-10-24");
  const result = summarizeForecast(fixture(), "monterrey", now);
  assert.deepEqual(result.days.map((day) => day.date), ["2026-10-24", "2026-10-25", "2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30"]);
  assert.equal(result.days[0].partial, true);
  assert.equal(result.days[1].partial, false);
  assert.equal(result.current.wind, 7.2);
});

test("overlapping one- and six-hour precipitation is counted once", () => {
  const result = summarizeForecast(fixture(), "monterrey", now);
  assert.equal(result.days[0].precipitation, 5);
  assert.equal(result.days[1].precipitation, 24);
});

test("six-hour intervals work at the longer horizon without losing temperature extremes", () => {
  const raw = fixture();
  raw.properties.timeseries = raw.properties.timeseries.filter((step) => new Date(step.time).getUTCHours() % 6 === 0);
  const lateNow = new Date("2026-10-25T06:00:00Z");
  for (const step of raw.properties.timeseries) delete step.data.next_1_hours;
  const result = summarizeForecast(raw, "garcia", lateNow);
  assert.equal(result.days[0].precipitation, 24);
  assert.equal(result.days[0].minimum, 18);
  assert.equal(result.days[0].maximum, 26);
  assert.equal(result.days[0].condition.label, "Lluvia prevista");
});

test("missing precipitation is unavailable, never a dry forecast", () => {
  const raw = fixture();
  const missing = raw.properties.timeseries.find((step) => step.time === "2026-10-26T05:00:00.000Z")!;
  delete missing.data.next_1_hours!.details!.precipitation_amount;
  assert.equal(summarizeForecast(raw, "guadalupe", now).days[1].precipitation, null);
});

test("old, malformed, incomplete and nonconsecutive forecasts fail closed", () => {
  const stale = fixture(); stale.properties.meta.updated_at = "2026-10-23T00:00:00Z";
  const invalid = fixture(); invalid.properties.meta.updated_at = "invalid";
  const missingDay = fixture(); missingDay.properties.timeseries = missingDay.properties.timeseries.filter((step) => localDay(new Date(step.time)) !== "2026-10-27");
  const tooShort = fixture(); tooShort.properties.timeseries = tooShort.properties.timeseries.slice(0, 20);
  for (const raw of [stale, invalid, missingDay, tooShort]) assert.throws(() => summarizeForecast(raw, "monterrey", now));
});

test("weather labels preserve rain, storms, winter precipitation and unknown conditions", () => {
  assert.equal(conditionFor("clearsky_night").label, "Despejado");
  assert.equal(conditionFor("clearsky_day").label, "Soleado");
  assert.equal(conditionFor("heavyrainandthunder").label, "Tormentas previstas");
  assert.equal(conditionFor("snow").label, "Precipitación invernal");
  assert.equal(conditionFor("unknown").label, "Condición no disponible");
});

test("API rejects unsupported municipalities and methods before contacting the provider", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("Must not contact provider"); };
  try {
    const bad = await weatherApi.fetch(new Request("https://example.test/api/clima?municipio=__proto__"));
    assert.equal(bad.status, 400);
    assert.equal(bad.headers.get("Cache-Control"), "no-store");
    const post = await weatherApi.fetch(new Request("https://example.test/api/clima", { method: "POST" }));
    assert.equal(post.status, 405);
  } finally { globalThis.fetch = originalFetch; }
});

test("Node runtime entry point forwards the status, JSON and cache headers", async () => {
  let status = 0, body = "";
  const headers = new Map<string, string>();
  const response = { set statusCode(value: number) { status = value; }, setHeader(name: string, value: string) { headers.set(name, value); }, end(value: string) { body = value; } };
  await handler({ url: "/api/clima?municipio=unknown", method: "GET" } as IncomingMessage, response as unknown as ServerResponse);
  assert.equal(status, 400);
  assert.equal(headers.get("cache-control"), "no-store");
  assert.equal(JSON.parse(body).error, "Selecciona un municipio de la cobertura.");
});
