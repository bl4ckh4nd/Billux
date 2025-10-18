import { useQuery } from '@tanstack/react-query';
import { orpc } from '../lib/api';
import type { Invoice } from '../types/invoice';

export const useCustomerInvoices = (customerName: string | undefined) => {
  return useQuery({
    ...orpc.invoices.getByCustomer.queryOptions({
      input: customerName ? { customerName } : undefined,
      enabled: !!customerName,
      initialData: [] as Invoice[]
    })
  });
};