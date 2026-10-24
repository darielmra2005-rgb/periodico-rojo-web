import { reference, z } from "astro:content";
import type { ImageFunction } from "astro:content";
import { MUNICIPALITY_SLUGS } from "../config/municipal";

export const articleSchema = (image: ImageFunction) =>
  z.object({
    isDraft: z.boolean().default(false),
    reviewed: z.boolean().default(false),
    municipality: z.enum(MUNICIPALITY_SLUGS).optional(),
    sourceName: z.string().optional(),
    sourceUrl: z.string().url().refine((url) => /^https?:\/\//.test(url), "Usa un enlace http o https").optional(),
    photoCredit: z.string().optional(),
    eventDate: z.string().datetime({ offset: true }).optional(),
    eventLocation: z.string().optional(),
    eventAdmission: z.string().optional(),
    eventStatus: z.enum(["programado", "cancelado"]).optional(),
    isMainHeadline: z.boolean().default(false),
    isSubHeadline: z.boolean().default(false),
    cover: image().optional(),
    covert_alt: z.string().optional(),
    title: z.string().max(120, "Máximo 120 caracteres"),
    description: z.string().max(160, "Too long, max 160 characters"),
    category: reference("categories"),
    authors: z.array(reference("authors")).min(1),
    publishedTime: z.string().datetime({ offset: true }).or(z.date()),
  });

export const viewSchema = z.object({
  title: z.string(),
  description: z.string(),
  blocks: z.array(z.any()),
});

export const categorySchema = z.object({
  title: z.string(),
  path: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "The string must be a slug (only lowercase letters, numbers, and hyphens)."
    ),
});

export const authorSchema = (Image: ImageFunction) =>
  z.object({
    name: z.string(),
    job: z.string(),
    avatar: Image(),
    bio: z.string(),
    social: z.array(
      z.object({
        name: z.string(),
        url: z.string(),
        icon: z.string(),
      })
    ),
  });

// avatar: Image().refine(
//   (img) => {
//       const isValidWidth = img.width > 100 && img.width < 2000;
//       const isValidHeight = img.height > 100 && img.height < 2000;
//       return isValidWidth && isValidHeight;
//   },
//   "Avatar image must have width and height between 100 and 2000"
// ),
