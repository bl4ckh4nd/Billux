import { os } from '@orpc/server';
import { z } from 'zod';
import { mockApi } from '../server/mockApi';
import type { Project, CreateProjectDTO } from '../../types/project';

const projectIdSchema = z.object({ id: z.string() });
const customerIdSchema = z.object({ customerId: z.string() });

const createProjectSchema = z.object({
  title: z.string(),
  description: z.string(),
  customerId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.number()
});

const updateProjectSchema = z.object({
  id: z.string(),
  data: createProjectSchema.partial().extend({
    status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional(),
    notes: z.string().optional()
  })
});

export const getAll = os.handler(async (): Promise<Project[]> => {
  return mockApi.projects.getAll();
});

export const get = os
  .input(projectIdSchema)
  .handler(async ({ input }): Promise<Project | undefined> => {
    return mockApi.projects.get(input.id);
  });

export const getByCustomer = os
  .input(customerIdSchema)
  .handler(async ({ input }): Promise<Project[]> => {
    return mockApi.projects.getByCustomer(input.customerId);
  });

export const create = os
  .input(createProjectSchema)
  .handler(async ({ input }): Promise<Project> => {
    return mockApi.projects.create(input as CreateProjectDTO);
  });

export const update = os
  .input(updateProjectSchema)
  .handler(async ({ input }): Promise<Project> => {
    return mockApi.projects.update(input.id, input.data);
  });

export const remove = os
  .input(projectIdSchema)
  .handler(async ({ input }): Promise<void> => {
    return mockApi.projects.delete(input.id);
  });
