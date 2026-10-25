import { isOfficialSource } from "../config/official-sources.ts";

type PublicationData = {
  isDraft?: boolean;
  reviewed?: boolean;
  municipality?: string;
  sourceName?: string;
  sourceUrl?: string;
  sourcePublishedDate?: string;
  publishedTime: string | Date;
};

export function matchesEdition(data: { municipality?: string; category?: string }, municipality = "", category = ""): boolean {
  return (!municipality || data.municipality === municipality) && (!category || data.category === category);
}

// Shared publication rule for pages, search and RSS. Legacy demo articles
// have neither editorial review nor a municipality, so they stay unpublished.
export function isPublishedMunicipalArticle(data: PublicationData, now = new Date()): boolean {
  if (data.isDraft === true || data.reviewed !== true || !data.sourceName?.trim() || !isOfficialSource(data.sourceUrl, data.municipality)) return false;
  const published = new Date(data.publishedTime);
  const original = data.sourcePublishedDate;
  if (!Number.isFinite(published.getTime()) || published > now || !original || !/^\d{4}-\d{2}-\d{2}$/.test(original)) return false;
  const originalDate = new Date(`${original}T00:00:00Z`);
  if (!Number.isFinite(originalDate.getTime()) || originalDate.toISOString().slice(0, 10) !== original) return false;
  // Compare calendar dates in the municipality's timezone. The source provides
  // a day, not an invented publication hour; it cannot follow our own article.
  const parts = new Intl.DateTimeFormat("en", { timeZone: "America/Monterrey", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(published);
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  return original <= `${part("year")}-${part("month")}-${part("day")}`;
}

export function isUpcomingEvent(date: string | Date | undefined, status: string | undefined, now = new Date()): boolean {
  return Boolean(date && status !== "cancelado" && new Date(date) >= now);
}
