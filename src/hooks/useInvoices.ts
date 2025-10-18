import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, orpc } from '../lib/api';
import type { CreateInvoiceDTO, Invoice, Payment } from '../types/invoice';

export const useInvoices = () => {
  return useQuery({
    ...orpc.invoices.getAll.queryOptions()
  });
};

export const useInvoice = (id: string) => {
  return useQuery({
    ...orpc.invoices.get.queryOptions({
      input: { id },
      enabled: !!id
    })
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceDTO) => api.invoices.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.invoices.getAll.queryKey() });
    }
  });
};

export const useAddPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, payment }: { invoiceId: string, payment: Omit<Payment, 'id'> }) => 
      api.invoices.addPayment(invoiceId, payment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orpc.invoices.get.queryKey({ input: { id: variables.invoiceId } }) });
      queryClient.invalidateQueries({ queryKey: orpc.invoices.getAll.queryKey() });
    }
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.invoices.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orpc.invoices.getAll.queryKey() });
    }
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) => 
      api.invoices.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orpc.invoices.getAll.queryKey() });
      queryClient.invalidateQueries({ queryKey: orpc.invoices.get.queryKey({ input: { id: variables.id } }) });
    }
  });
};
