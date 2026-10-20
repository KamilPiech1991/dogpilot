import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Poradnik hodowcy – artykuły w Markdown (model: problem → wiedza → funkcja aplikacji → CTA).
const poradnik = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/poradnik' }),
  schema: z.object({
    title: z.string(), description: z.string(), date: z.coerce.date(), category: z.string(), minutes: z.number(),
    image: z.string(), tint: z.string().default('linear-gradient(135deg, #32BF46, #1F8A30)'), feature: z.string().optional(),
  }),
});
export const collections = { poradnik };
