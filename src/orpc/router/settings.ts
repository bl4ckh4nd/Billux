import { os } from '@orpc/server';
import { z } from 'zod';
import { mockApi } from '../server/mockApi';
import type { CompanySettings } from '../../types/settings';

export const get = os.handler(async (): Promise<CompanySettings> => {
  return mockApi.settings.get();
});

const updateSchema = z.object({
  data: z.any()
});

export const update = os
  .input(updateSchema)
  .handler(async ({ input }): Promise<CompanySettings> => {
    return mockApi.settings.update(input.data as Partial<CompanySettings>);
  });
