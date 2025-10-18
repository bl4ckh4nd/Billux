import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, orpc } from '../lib/api';
import type { Customer, CreateCustomerDTO } from '../types/customer';

export const useCustomers = () => {
  return useQuery({
    ...orpc.customers.getAll.queryOptions({ initialData: [] as Customer[] })
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    ...orpc.customers.getById.queryOptions({
      input: { id },
      enabled: !!id
    })
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerDTO) => api.customers.create(data),
    onSuccess: (newCustomer: Customer) => {
      queryClient.setQueryData(orpc.customers.getAll.queryKey(), (old: Customer[] = []) => [...old, newCustomer]);
      queryClient.invalidateQueries({ queryKey: orpc.customers.getAll.queryKey() });
    }
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) => 
      api.customers.update(id, data),
    onSuccess: (updatedCustomer: Customer) => {
      queryClient.setQueryData(orpc.customers.getById.queryKey({ input: { id: updatedCustomer.id } }), updatedCustomer);
      queryClient.setQueryData(orpc.customers.getAll.queryKey(), (old: Customer[] = []) =>
        old.map(customer => customer.id === updatedCustomer.id ? updatedCustomer : customer)
      );
      queryClient.invalidateQueries({ queryKey: orpc.customers.getAll.queryKey() });
    }
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.customers.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: orpc.customers.getById.queryKey({ input: { id } }) });
      queryClient.setQueryData(orpc.customers.getAll.queryKey(), (old: Customer[] = []) =>
        old.filter(customer => customer.id !== id)
      );
      queryClient.invalidateQueries({ queryKey: orpc.customers.getAll.queryKey() });
    }
  });
};
