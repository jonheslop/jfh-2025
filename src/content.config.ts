import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    image: z.string().optional(),
  }),
});

const photos = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/photos" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    coverImage: z.string(),
    photos: z.array(z.string()).optional(),
  }),
});

export const collections = { posts, photos };
