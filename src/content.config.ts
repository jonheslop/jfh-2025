import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";

const stream = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/stream" }),
  schema: z.object({
    description: z.string().optional(),
    photo: z.string(),
  }),
});

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

const jobs = defineCollection({
  loader: file("src/jobs.json", {
    parser: (text) => JSON.parse(text).jobs,
  }),
  schema: z.object({
    id: z.string(),
    company: z.string(),
    role: z.string(),
    period: z.string(),
    description: z.string(),
    logos: z.array(
      z.object({
        src: z.string(),
        alt: z.string(),
        bgColor: z.string(),
        width: z.number().min(1),
        height: z.number().min(1),
      }),
    ),
    blogPosts: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
        }),
      )
      .optional(),
  }),
});

export const collections = { posts, photos, jobs, stream };
