type PublicationData = {
  isDraft?: boolean;
  reviewed?: boolean;
  municipality?: string;
  sourceName?: string;
  sourceUrl?: string;
  publishedTime: string | Date;
};

export function matchesEdition(data: { municipality?: string; category?: string }, municipality = "", category = ""): boolean {
  return (!municipality || data.municipality === municipality) && (!category || data.category === category);
}

// Shared publication rule for pages, search and RSS. Legacy demo articles
// have neither editorial review nor a municipality, so they stay unpublished.
export function isPublishedMunicipalArticle(data: PublicationData, now = new Date()): boolean {
  const published = new Date(data.publishedTime);
  return data.isDraft !== true && data.reviewed === true &&
    Boolean(data.municipality && data.sourceName?.trim() && data.sourceUrl) &&
    Number.isFinite(published.getTime()) && published <= now;
}

export function isUpcomingEvent(date: string | Date | undefined, status: string | undefined, now = new Date()): boolean {
  return Boolean(date && status !== "cancelado" && new Date(date) >= now);
}
