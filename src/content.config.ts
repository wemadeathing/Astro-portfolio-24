import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    image: z.string().url(),
    tags: z.array(z.string()).default([]),
    // AI-facing metadata (optional)
    ai_summary: z.string().optional(),
    topics: z.array(z.string()).optional().default([]),
    recommended_for: z.array(z.string()).optional().default([]),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string(),
    tags: z.array(z.string()),
    featured: z.boolean().default(false),
    published: z.boolean().default(true),
    // AI-facing metadata (optional)
    ai_summary: z.string().optional(),
    use_for_questions: z.array(z.string()).optional().default([]),
  }),
});

const resources = defineCollection({
  type: 'content',
  schema: z.object({
    url: z.string().url(),
    // Optional overrides (auto-generated otherwise)
    title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),

    type: z
      .enum(['video', 'article', 'tool', 'paper', 'template', 'repo', 'podcast', 'other'])
      .optional()
      .default('other'),
    tags: z.array(z.string()).default([]),
    addedDate: z.coerce.date().optional(),
    featured: z.boolean().default(false),
  }),
});

// Knowledge base for the chat assistant
const assistant = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    headline: z.string(),
    years_experience: z.string(),
    primary_focus: z.array(z.string()).default([]),
  }),
});

export const collections = { blog, projects, resources, assistant };

