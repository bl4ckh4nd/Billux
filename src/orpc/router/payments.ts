import { os } from '@orpc/server';
import { z } from 'zod';
import { mockApi } from '../server/mockApi';
import type { Payment } from '../../types/invoice';

const customerNameSchema = z.object({ customerName: z.string() });

export const getAll = os.handler(async (): Promise<Payment[]> => {
  return mockApi.payments.getAll();
});

export const getByCustomer = os
  .input(customerNameSchema)
  .handler(async ({ input }): Promise<Payment[]> => {
    return mockApi.payments.getByCustomer(input.customerName);
  });
