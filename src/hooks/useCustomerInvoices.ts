import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Invoice } from '../types/invoice';

export const useCustomerInvoices = (customerName: string | undefined) => {
  return useQuery<Invoice[], Error>({
    queryKey: ['invoices', 'customer', customerName],
    queryFn: () => customerName ? api.invoices.getByCustomer(customerName) : Promise.resolve([]),
    enabled: !!customerName
  });
};