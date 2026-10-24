import type { Link } from "../types";
import { NEWS_CATEGORIES } from "./municipal";

export const SITE = {
  title: "PERIÓDICO ROJO",
  description: "Noticias, eventos y avisos municipales de la zona metropolitana de Monterrey, con revisión editorial y fuentes oficiales.",
  author: "Redacción de Periódico Rojo",
  url: "https://periodico-rojo-web.vercel.app",
  github: "https://github.com/darielmra2005-rgb/periodico-rojo-web",
  locale: "es-MX",
  dir: "ltr",
  charset: "UTF-8",
  basePath: "/",
  postsPerPage: 12,
};

export const NAVIGATION_LINKS: Link[] = NEWS_CATEGORIES.map(({ slug, name }) => ({ href: `/categorias/${slug}`, text: name }));
export const OTHER_LINKS: Link[] = [
  { href: "/about", text: "Sobre el periódico" },
  { href: "/rss.xml", text: "RSS" },
];
export const SOCIAL_LINKS: Link[] = [];
