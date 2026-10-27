import { z } from "zod";

export const ProjectSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  period: z.string(),
  status: z.string(),
  isFeatured: z.boolean(),
  order: z.number().int(),
  devStack: z.array(z.string()),
  visualStack: z.array(z.string()),
  demoUrl: z.string().nullable(),
  githubUrl: z.string(),
  readmeContent: z.string().nullable(),
  syncedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});