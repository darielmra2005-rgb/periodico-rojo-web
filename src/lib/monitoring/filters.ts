export function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-MX").trim();
}

export function matchesProject(
  record: { search: string; municipality: string; sector: string; saved: boolean },
  filters: { query: string; municipality: string; sector: string; savedOnly: boolean },
): boolean {
  const terms = normalizeSearch(filters.query).split(/\s+/).filter(Boolean);
  const search = normalizeSearch(record.search);
  return terms.every((term) => search.includes(term)) && (!filters.municipality || filters.municipality === record.municipality) && (!filters.sector || filters.sector === record.sector) && (!filters.savedOnly || record.saved);
}

export function parseSavedProjects(value: string | null): Set<string> {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string" && /^[a-f0-9-]{36}$/i.test(id)) : []);
  } catch { return new Set(); }
}
