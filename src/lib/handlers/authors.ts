import { getCollection } from "astro:content";
import { isPublishedMunicipalArticle } from "./publication";

const authorsCollection = await getCollection("authors");
const published = (await getCollection("articles")).filter((article) => isPublishedMunicipalArticle(article.data));
const activeIds = new Set(["redaccion", ...published.flatMap((article) => article.data.authors.map((author) => author.id))]);

export const authorsHandler = {
  allAuthors: () => authorsCollection.filter((author) => activeIds.has(author.id)),
  limitAurhors: (limit: number) => authorsCollection.filter((author) => activeIds.has(author.id)).slice(0, limit),
  getAuthors: (authors: { collection: string; id: string }[]) => {
    return authors.map(({ id }) => {
      const author = authorsCollection.find((author) => author.id === id);
      if (!author) {
        throw new Error(`Author ${id} not found`);
      }
      return author;
    });
  },
  findAuthor: (id: string) => {
    const author = authorsCollection.find((author) => author.id === id);
    if (!author) {
      throw new Error(`Author ${id} not found`);
    }
    return author;
  },
};
