import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Payment } from '../types/invoice';

export const useCustomerPayments = (customerName: string | undefined) => {
  return useQuery<Payment[], Error>({
    queryKey: ['payments', 'customer', customerName],
    queryFn: () => customerName ? api.payments.getByCustomer(customerName) : Promise.resolve([]),
    enabled: !!customerName
  });
};