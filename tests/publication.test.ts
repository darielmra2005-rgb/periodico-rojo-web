import { test } from "node:test";
import assert from "node:assert/strict";
import { isPublishedMunicipalArticle, isUpcomingEvent, matchesEdition } from "../src/lib/handlers/publication.ts";

const now = new Date("2026-10-24T18:00:00Z");
const reviewedNews = {
  reviewed: true,
  isDraft: false,
  municipality: "garcia",
  sourceName: "Gobierno municipal",
  sourceUrl: "https://example.org/comunicado",
  publishedTime: "2026-10-24T17:00:00Z",
};

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
