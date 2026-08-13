import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const post = defineCollection({
  loader: glob({
    base: './src/content/post',
    pattern: '**/*.md',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    cover: z.string().optional(),
    categories: z
      .union([
        z.string(),
        z.array(z.string()),
        z.array(z.array(z.string())),
      ])
      .optional(),
    tags: z.array(z.string()).default([]),
    downloads: z
      .array(
        z.object({
          label: z.string(),
          url: z.url(),
        })
      )
      .optional(),
    publishDate: z.coerce.date().optional(),
    date: z.coerce.date().optional(),
    abbrlink: z.union([z.string(), z.number()]).optional(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

const docs = defineCollection({
  loader: glob({
    base: './src/content/docs',
    pattern: '**/*.mdx',
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    cover: z.string().optional(),
    date: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    abbrlink: z.union([z.string(), z.number()]).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { post, docs };
