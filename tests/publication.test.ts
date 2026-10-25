import { test } from "node:test";
import assert from "node:assert/strict";
import { isPublishedMunicipalArticle, isUpcomingEvent, matchesEdition } from "../src/lib/handlers/publication.ts";
import { isOfficialSource, OFFICIAL_SOURCES } from "../src/lib/config/official-sources.ts";

const now = new Date("2026-10-24T18:00:00Z");
const reviewedNews = {
  reviewed: true,
  isDraft: false,
  municipality: "garcia",
  sourceName: "Gobierno municipal",
  sourceUrl: "https://garcia.gob.mx/comunicado-para-prueba-unitaria/",
  sourcePublishedDate: "2026-10-23",
  publishedTime: "2026-10-24T17:00:00Z",
};

test("only the registered official portal for the article's municipality is accepted", () => {
  for (const [municipality, source] of Object.entries(OFFICIAL_SOURCES)) {
    assert.equal(isOfficialSource(source.portal, municipality), true);
    assert.equal(isOfficialSource(`https://www.${source.hostname}/comunicado`, municipality), true);
  }
  assert.equal(isOfficialSource("https://www.monterrey.gob.mx/noticias/", "garcia"), false);
  assert.equal(isOfficialSource("https://garcia.gob.mx/noticia", "unknown"), false);
  assert.equal(isOfficialSource("https://garcia.gob.mx/noticia", "toString"), false);
});

test("a valid URL or official-looking name cannot bypass the source restriction", () => {
  for (const sourceUrl of [
    "https://example.org/comunicado",
    "https://garcia.gob.mx.example.org/noticia",
    "https://fakegarcia.gob.mx/noticia",
    "https://example.org/garcia.gob.mx/noticia",
    "https://garcia.gob.mx@example.org/noticia",
    "https://usuario@garcia.gob.mx/noticia",
    "https://garcia.gob.mx:8443/noticia",
    "http://garcia.gob.mx/noticia",
    "https://www.facebook.com/noticia",
    "not-a-url",
  ]) {
    assert.equal(isPublishedMunicipalArticle({ ...reviewedNews, sourceUrl }, now), false, sourceUrl);
  }
});

test("San Pedro's verified news blog is accepted only for its own municipality and exact hostname", () => {
  const sourceUrl = "https://blog.sanpedro.gob.mx/news/comunicado-de-prueba/";
  const data = { ...reviewedNews, municipality: "san-pedro", sourceUrl };
  assert.equal(isPublishedMunicipalArticle(data, now), true);
  for (const municipality of ["garcia", "san-nicolas", "monterrey", "escobedo", "guadalupe"]) {
    assert.equal(isPublishedMunicipalArticle({ ...data, municipality }, now), false);
  }
  for (const sourceUrl of [
    "https://blog.sanpedro.gob.mx.example.org/news/",
    "https://fakeblog.sanpedro.gob.mx/news/",
    "https://www.blog.sanpedro.gob.mx/news/",
    "https://otro.sanpedro.gob.mx/news/",
    "https://usuario@blog.sanpedro.gob.mx/news/",
    "https://blog.sanpedro.gob.mx:8443/news/",
    "http://blog.sanpedro.gob.mx/news/",
  ]) assert.equal(isPublishedMunicipalArticle({ ...data, sourceUrl }, now), false, sourceUrl);
});

test("municipality and topic filters intersect rather than adding unrelated stories", () => {
  const news = [
    { municipality: "garcia", category: "cultura" },
    { municipality: "garcia", category: "deportes" },
    { municipality: "monterrey", category: "cultura" },
  ];
  assert.deepEqual(news.filter((item) => matchesEdition(item, "garcia", "cultura")), [news[0]]);
  assert.deepEqual(news.filter((item) => matchesEdition(item, "", "cultura")), [news[0], news[2]]);
  assert.deepEqual(news.filter((item) => matchesEdition(item, "garcia", "")), [news[0], news[1]]);
  assert.equal(news.filter((item) => matchesEdition(item)).length, 3);
  assert.equal(news.filter((item) => matchesEdition(item, "guadalupe", "cultura")).length, 0);
});

test("a reviewed, sourced municipal article can be published without a photograph", () => {
  assert.equal(isPublishedMunicipalArticle(reviewedNews, now), true);
});
test("editorial review cannot override draft status", () => {
  assert.equal(isPublishedMunicipalArticle({ ...reviewedNews, isDraft: true }, now), false);
});
test("neither an unreviewed article nor legacy template content is published", () => {
  assert.equal(isPublishedMunicipalArticle({ ...reviewedNews, reviewed: false }, now), false);
  assert.equal(isPublishedMunicipalArticle({ publishedTime: "2025-01-01T00:00:00Z" }, now), false);
});
test("source attribution and municipality are required at publication", () => {
  for (const missing of [{ sourceName: "  " }, { sourceUrl: undefined }, { municipality: undefined }]) {
    assert.equal(isPublishedMunicipalArticle({ ...reviewedNews, ...missing }, now), false);
  }
});
test("scheduled notes remain hidden until their publication time", () => {
  const data = { ...reviewedNews, publishedTime: "2026-10-24T12:30:00-06:00" };
  assert.equal(isPublishedMunicipalArticle(data, now), false);
  assert.equal(isPublishedMunicipalArticle(data, new Date("2026-10-24T18:30:00Z")), true);
});
test("invalid publication dates fail closed", () => {
  assert.equal(isPublishedMunicipalArticle({ ...reviewedNews, publishedTime: "invalid" }, now), false);
});
test("an original source date is required and must be a real calendar day", () => {
  for (const sourcePublishedDate of [undefined, "", "23/10/2026", "2026-02-30", "invalid"]) {
    assert.equal(isPublishedMunicipalArticle({ ...reviewedNews, sourcePublishedDate }, now), false);
  }
});
test("a source cannot be dated after the article, using the municipality's calendar day", () => {
  assert.equal(isPublishedMunicipalArticle({ ...reviewedNews, sourcePublishedDate: "2026-10-25" }, now), false);
  const midnightUTC = { ...reviewedNews, publishedTime: "2026-10-24T03:00:00Z", sourcePublishedDate: "2026-10-24" };
  assert.equal(isPublishedMunicipalArticle(midnightUTC, now), false);
  assert.equal(isPublishedMunicipalArticle({ ...midnightUTC, sourcePublishedDate: "2026-10-23" }, now), true);
});
test("an upcoming event is evaluated using its event time, including timezone", () => {
  assert.equal(isUpcomingEvent("2026-10-24T13:00:00-06:00", "programado", now), true);
  assert.equal(isUpcomingEvent("2026-10-24T11:00:00-06:00", "programado", now), false);
});
test("cancelled, past or undated events never appear in the upcoming agenda", () => {
  assert.equal(isUpcomingEvent("2026-11-01T18:00:00Z", "cancelado", now), false);
  assert.equal(isUpcomingEvent("2026-10-01T18:00:00Z", "programado", now), false);
  assert.equal(isUpcomingEvent(undefined, undefined, now), false);
  assert.equal(isUpcomingEvent("invalid", "programado", now), false);
});
