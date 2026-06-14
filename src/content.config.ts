import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

const imageObject = z.object({
  id: z.string(),
  width: z.number(),
  height: z.number(),
});

const stream = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./content/stream" }),
  schema: z.object({
    photo: imageObject.optional(),
    camera: z.string().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./content/posts" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    image: z.string().optional(),
  }),
});

const photos = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./content/photos" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    coverImage: imageObject,
    photos: z.array(imageObject).optional(),
  }),
});

const links = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./content/links" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    url: z.string(),
    tags: z.array(z.string()),
    type: z.string().optional(),
    via: z.string().optional(),
  }),
});

const jobs = defineCollection({
  loader: file("content/jobs.json", {
    parser: (text) => JSON.parse(text).jobs,
  }),
  schema: z.object({
    id: z.string(),
    company: z.string(),
    role: z.string(),
    period: z.string(),
    order: z.number(),
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

export const collections = { posts, photos, jobs, stream, links };
