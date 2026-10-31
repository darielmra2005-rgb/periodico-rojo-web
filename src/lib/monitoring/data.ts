import sources from "../../data/monitoring/sources.json";
import projects from "../../data/monitoring/projects.json";
import events from "../../data/monitoring/events.json";
import { parseCatalog, publishedRecords } from "./catalog.ts";

export const catalog = parseCatalog({ sources, projects, events });
export const projectRecords = publishedRecords(catalog);
