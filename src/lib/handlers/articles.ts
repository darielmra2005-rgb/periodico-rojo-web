import { getCollection } from "astro:content";
import { isPublishedMunicipalArticle } from "./publication";

const articlesCollection = (
  await getCollection("articles", ({ data }) => {
    return isPublishedMunicipalArticle(data);
  })
).sort((a, b) =>
  (b.data.sourcePublishedDate ?? "").localeCompare(a.data.sourcePublishedDate ?? "") ||
  new Date(b.data.publishedTime).getTime() - new Date(a.data.publishedTime).getTime()
);

export const articlesHandler = {
  allArticles: () => articlesCollection,

  mainHeadline: () => {
    const article = articlesCollection.filter(
      (article) => article.data.isMainHeadline === true
    )[0];
    return article ?? articlesCollection[0];
  },

  subHeadlines: () => {
    const mainHeadline = articlesHandler.mainHeadline();
    const subHeadlines = articlesCollection
      .filter(
        (article) =>
          article.data.isSubHeadline === true &&
          mainHeadline?.id !== article.id
      )
      .slice(0, 4);

    return subHeadlines;
  },
};
