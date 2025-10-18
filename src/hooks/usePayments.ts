import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, orpc } from '../lib/api';
import type { CreatePaymentDTO, Payment } from '../types/invoice';

export const usePayments = () => {
  const queryClient = useQueryClient();

  const { data: payments, isLoading, error } = useQuery({
    ...orpc.payments.getAll.queryOptions()
  });

  const addPayment = useMutation({
    mutationFn: (newPayment: CreatePaymentDTO) => {
      return api.invoices.addPayment(newPayment.invoiceId, newPayment);
    },
    onSuccess: (_payment, variables) => {
      // Invalidate and refetch the invoice query to update the payment list
      queryClient.invalidateQueries({ queryKey: orpc.invoices.get.queryKey({ input: { id: variables.invoiceId } }) });
      // Also invalidate the invoices list to update totals
      queryClient.invalidateQueries({ queryKey: orpc.invoices.getAll.queryKey() });
      // Also invalidate the payments list
      queryClient.invalidateQueries({ queryKey: orpc.payments.getAll.queryKey() });
    },
  });

  return {
    payments: payments || [],
    isLoading,
    error,
    addPayment,
  };
};