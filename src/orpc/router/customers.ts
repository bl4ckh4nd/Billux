import { os } from '@orpc/server';
import { z } from 'zod';
import { mockApi } from '../server/mockApi';
import { customerSchema } from '../../types/customer';
import type { Customer, CreateCustomerDTO } from '../../types/customer';

const customerIdSchema = z.object({ id: z.string() });

export const getAll = os.handler(async (): Promise<Customer[]> => {
  return mockApi.customers.getAll();
});

export const getById = os
  .input(customerIdSchema)
  .handler(async ({ input }): Promise<Customer | undefined> => {
    return mockApi.customers.getById(input.id);
  });

export const create = os
  .input(customerSchema)
  .handler(async ({ input }): Promise<Customer> => {
    return mockApi.customers.create(input as CreateCustomerDTO);
  });

const updateSchema = z.object({
  id: z.string(),
  data: customerSchema.partial()
});

export const update = os
  .input(updateSchema)
  .handler(async ({ input }): Promise<Customer> => {
    return mockApi.customers.update(input.id, input.data);
  });

export const remove = os
  .input(customerIdSchema)
  .handler(async ({ input }): Promise<void> => {
    return mockApi.customers.delete(input.id);
  });
