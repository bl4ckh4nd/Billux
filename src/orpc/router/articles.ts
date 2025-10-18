import { os } from '@orpc/server';
import { z } from 'zod';
import { mockApi } from '../server/mockApi';
import type { Article, CreateArticleDTO, UpdateArticleDTO } from '../../types/article';

const articleIdSchema = z.object({ id: z.string() });

const createArticleSchema = z.object({
  name: z.string(),
  description: z.string(),
  unit: z.string(),
  basePrice: z.number(),
  category: z.string(),
  isActive: z.boolean().optional(),
  stock: z.number().optional(),
  minStock: z.number().optional(),
  taxRate: z.number().optional(),
  notes: z.string().optional()
});

const updateArticleSchema = z.object({
  id: z.string(),
  data: createArticleSchema.partial()
});

export const getAll = os.handler(async (): Promise<Article[]> => {
  return mockApi.articles.getAll();
});

export const get = os
  .input(articleIdSchema)
  .handler(async ({ input }): Promise<Article | undefined> => {
    return mockApi.articles.get(input.id);
  });

export const create = os
  .input(createArticleSchema)
  .handler(async ({ input }): Promise<Article> => {
    return mockApi.articles.create(input as CreateArticleDTO);
  });

export const update = os
  .input(updateArticleSchema)
  .handler(async ({ input }): Promise<Article> => {
    return mockApi.articles.update(input.id, input.data as UpdateArticleDTO);
  });

export const remove = os
  .input(articleIdSchema)
  .handler(async ({ input }): Promise<void> => {
    return mockApi.articles.delete(input.id);
  });
