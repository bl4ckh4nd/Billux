import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CreatePaymentDTO, Payment } from '../types/invoice';

export const usePayments = () => {
  const queryClient = useQueryClient();

  const { data: payments, isLoading, error } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: api.payments.getAll,
  });

  const addPayment = useMutation({
    mutationFn: (newPayment: CreatePaymentDTO) => {
      return api.invoices.addPayment(newPayment.invoiceId, newPayment);
    },
    onSuccess: (_payment, variables) => {
      // Invalidate and refetch the invoice query to update the payment list
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      // Also invalidate the invoices list to update totals
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      // Also invalidate the payments list
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });

  return {
    payments: payments || [],
    isLoading,
    error,
    addPayment,
  };
};