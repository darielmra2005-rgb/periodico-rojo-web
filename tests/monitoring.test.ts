import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCatalog, publishedRecords, sourceDate, formatDay, mexicoDay, isSourceUrl } from "../src/lib/monitoring/catalog.ts";
import { matchesProject, parseSavedProjects } from "../src/lib/monitoring/filters.ts";

const read = (name: string) => JSON.parse(readFileSync(new URL(`../src/data/monitoring/${name}.json`, import.meta.url), "utf8"));
const fixture = () => parseCatalog({ sources: read("sources"), projects: read("projects"), events: read("events") });
const asOf = "2026-10-30";
const correctionId = "6c69b6d8-2a66-4523-8b22-f1f771a0ec11";

test("the initial public records retain source dates and disclose unknown occurrence dates", () => {
  const records = publishedRecords(fixture(), asOf);
  assert.equal(records.length, 2);
  assert.equal(records[0].project.slug, "limpieza-canal-medular");
  assert.equal(sourceDate(records[0].latest), "2026-10-23");
  assert.equal(records[0].latest.occurredOn, null);
  assert.equal(records[0].latest.stage, "avance-reportado");
  assert.equal(records[1].latest.stage, "anunciado");
  assert.equal(records[0].sources[0].usage.status, "pendiente");
});

test("unreviewed or private events never contribute to public routes, histories or counts", () => {
  for (const hidden of ["review", "event", "project"] as const) {
    const data = fixture();
    if (hidden === "review") data.events[0].review = { status: "pendiente", reviewedOn: null, reviewer: null };
    if (hidden === "event") data.events[0].isPublic = false;
    if (hidden === "project") data.projects[0].isPublic = false;
    const records = publishedRecords(parseCatalog(data), asOf);
    assert.equal(records.length, 1);
    assert.equal(records[0].project.slug, "visor-urbano-geoportal-escobedo");
    assert.equal(records.flatMap((record) => record.events).length, 1);
  }
});

test("a future review does not publish early and the cutoff uses the Mexican calendar", () => {
  assert.equal(publishedRecords(fixture(), "2026-10-29").length, 0);
  assert.equal(mexicoDay(new Date("2026-10-31T03:00:00Z")), "2026-10-30");
  assert.equal(mexicoDay(new Date("2026-10-31T06:00:00Z")), "2026-10-31");
});

test("reviewed events require a reviewer, review date and field-level evidence", () => {
  for (const missing of ["reviewer", "date", "evidence", "locator", "stage"] as const) {
    const data = fixture();
    if (missing === "reviewer") data.events[0].review.reviewer = null;
    if (missing === "date") data.events[0].review.reviewedOn = null;
    if (missing === "evidence") data.events[0].evidence = [];
    if (missing === "locator") data.events[0].evidence[0].locator = " ";
    if (missing === "stage") data.events[0].evidence[0].supports = ["title", "summary", "location"];
    assert.throws(() => parseCatalog(data), missing);
  }
});

test("assigning an occurrence date requires its own documentary support", () => {
  const data = fixture();
  data.events[0].occurredOn = "2026-10-23";
  assert.throws(() => parseCatalog(data), /evidencia/);
  data.events[0].evidence[0].supports.push("occurredOn");
  assert.doesNotThrow(() => parseCatalog(data));
});

test("calendar errors and captures preceding publication fail the build", () => {
  const data = fixture();
  data.events[0].evidence[0].publishedOn = "2026-02-30";
  assert.throws(() => parseCatalog(data));
  data.events[0].evidence[0].publishedOn = "2026-11-01";
  assert.throws(() => parseCatalog(data), /antecede/);
});

test("foreign keys and duplicate identities cannot silently merge projects", () => {
  const unknown = "64ddc36e-f986-45c3-82fc-a21643a665b6";
  const data = fixture();
  data.events[0].projectId = unknown;
  assert.throws(() => parseCatalog(data), /Proyecto desconocido/);
  const duplicate = fixture();
  duplicate.projects[1].id = duplicate.projects[0].id;
  assert.throws(() => parseCatalog(duplicate), /duplicados/);
  const sameRoute = fixture();
  sameRoute.projects[1].slug = sameRoute.projects[0].slug;
  assert.throws(() => parseCatalog(sameRoute), /duplicados/);
  const unknownSource = fixture();
  unknownSource.events[0].evidence[0].sourceId = "origen-no-registrado";
  assert.throws(() => parseCatalog(unknownSource), /Fuente/);
});

test("evidence URLs cannot imitate an approved host or use another municipality's source", () => {
  const source = fixture().sources[0];
  for (const url of [
    "https://monterrey.gob.mx.example.org/noticia",
    "https://example.org/monterrey.gob.mx",
    "https://usuario@monterrey.gob.mx/noticia",
    "https://monterrey.gob.mx:8443/noticia",
    "http://monterrey.gob.mx/noticia",
    "https://escobedo.gob.mx/?p=notas",
    "javascript:alert(1)",
  ]) {
    assert.equal(isSourceUrl(url, source), false, url);
    const data = fixture();
    data.events[0].evidence[0].url = url;
    assert.throws(() => parseCatalog(data), url);
  }
});

test("an announcement or a statement cannot be promoted to a permit or completion", () => {
  const data = fixture();
  data.events[1].stage = "conclusion-reportada";
  assert.throws(() => parseCatalog(data), /anuncio/);
  const resolution = fixture();
  resolution.events[0].type = "resolucion";
  resolution.events[0].stage = "resolucion";
  assert.throws(() => parseCatalog(resolution), /acto original/);
});

test("a public portal does not automatically become a verified reuse license", () => {
  const data = fixture();
  data.sources[0].usage.status = "verificada";
  assert.throws(() => parseCatalog(data), /licencia/);
});

test("a reviewed correction replaces the summary while preserving the original history", () => {
  const data = fixture();
  data.events.push({ ...structuredClone(data.events[0]), id: correctionId, type: "correccion", title: "Rectificación editorial de prueba", summary: "Resumen corregido de prueba.", supersedesEventId: data.events[0].id });
  const records = publishedRecords(parseCatalog(data), asOf);
  assert.equal(records[0].latest.id, correctionId);
  assert.equal(records[0].events.length, 2);
  assert.ok(records[0].events.some((event) => event.id === data.events[0].id));
});

test("a pending correction cannot hide a previously reviewed record", () => {
  const data = fixture();
  data.events.push({ ...structuredClone(data.events[0]), id: correctionId, type: "correccion", supersedesEventId: data.events[0].id, review: { status: "pendiente", reviewedOn: null, reviewer: null } });
  const record = publishedRecords(parseCatalog(data), asOf)[0];
  assert.equal(record.latest.id, data.events[0].id);
  assert.equal(record.events.length, 1);
});

test("corrections cannot reference another project, themselves, or form a cycle", () => {
  for (const variant of ["other", "self", "cycle"] as const) {
    const data = fixture();
    const first = data.events[0];
    first.type = "correccion";
    if (variant === "other") first.supersedesEventId = data.events[1].id;
    if (variant === "self") first.supersedesEventId = first.id;
    if (variant === "cycle") {
      first.supersedesEventId = correctionId;
      data.events.push({ ...structuredClone(first), id: correctionId, supersedesEventId: first.id });
    }
    assert.throws(() => parseCatalog(data), variant);
  }
});

test("date-only formatting does not shift the original date to the previous day", () => {
  assert.equal(formatDay("2026-10-23"), "23 de octubre de 2026");
  assert.equal(formatDay(null), "Sin fecha precisa en la evidencia");
});

test("search terms, municipality, topic and saved filter combine and ignore accents", () => {
  const record = { search: "Planeación urbana de Escobedo", municipality: "escobedo", sector: "planeacion-urbana", saved: true };
  const filters = { query: "ESCOBEDO planeacion", municipality: "escobedo", sector: "planeacion-urbana", savedOnly: true };
  assert.equal(matchesProject(record, filters), true);
  assert.equal(matchesProject(record, { ...filters, municipality: "monterrey" }), false);
  assert.equal(matchesProject(record, { ...filters, sector: "energia" }), false);
  assert.equal(matchesProject({ ...record, saved: false }, filters), false);
  assert.equal(matchesProject(record, { ...filters, query: "escobedo medular" }), false);
});

test("damaged or unexpected local storage never prevents opening the list", () => {
  for (const value of [null, "not json", "null", "{}", "42", '[null, {}, 123, "bad-id"]']) assert.equal(parseSavedProjects(value).size, 0);
  assert.deepEqual([...parseSavedProjects(JSON.stringify([correctionId, correctionId, 42]))], [correctionId]);
});
