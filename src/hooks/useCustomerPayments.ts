import { useQuery } from '@tanstack/react-query';
import { orpc } from '../lib/api';
import type { Payment } from '../types/invoice';

export const useCustomerPayments = (customerName: string | undefined) => {
  return useQuery({
    ...orpc.payments.getByCustomer.queryOptions({
      input: customerName ? { customerName } : undefined,
      enabled: !!customerName,
      initialData: [] as Payment[]
    })
  });
};