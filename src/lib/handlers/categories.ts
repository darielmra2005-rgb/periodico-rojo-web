import { getCollection } from "astro:content";
import { articlesHandler } from "./articles";
import { NEWS_CATEGORIES } from "../config/municipal";

const categoriesCollection = (await getCollection('categories')).filter((category) => NEWS_CATEGORIES.some((item) => item.slug === category.id));

export const categoriesHandler = {
    allCategories: () => categoriesCollection.sort((a, b) => a.data.title.localeCompare(b.data.title)),
    oneCategory: (categoryId: string) => {
        const category = categoriesCollection.find((category) => category.id === categoryId);
        if (!category) {
            throw new Error(`Category with id ${categoryId} not found`);
        }
        return category;
    },
    allCategoriesWithLatestArticles: () => {
        return categoriesCollection.map((category) => {
            const articles = articlesHandler.allArticles()
                .filter((article) => article.data.category.id === category.id);
            return {
                ...category,
                data: {
                    ...category.data,
                    count: articles.length,
                    latestArticles: articles.slice(0, 3)
                }
            }
        })
    }
}
