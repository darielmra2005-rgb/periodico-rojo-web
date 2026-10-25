import rss from "@astrojs/rss";
import { articlesHandler } from "../lib/handlers/articles";
import { SITE } from "../lib/config";

export async function GET(context) {
  const articles = articlesHandler.allArticles();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site,
    items: articles.map((article) => ({
      title: article.data.title,
      pubDate: new Date(article.data.publishedTime),
      description: article.data.description,
      link: `/articles/${article.id}/`,
    })),
  });
}
