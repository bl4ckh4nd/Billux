import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Customer, CreateCustomerDTO } from '../types/customer';

export const useCustomers = () => {
  return useQuery<Customer[], Error>({
    queryKey: ['customers'],
    queryFn: api.customers.getAll,
    initialData: []
  });
};

export const useCustomer = (id: string) => {
  return useQuery<Customer | undefined, Error>({
    queryKey: ['customers', id],
    queryFn: () => api.customers.getById(id),
    enabled: !!id
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerDTO) => api.customers.create(data),
    onSuccess: (newCustomer: Customer) => {
      queryClient.setQueryData<Customer[]>(['customers'], (old = []) => [...old, newCustomer]);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) => 
      api.customers.update(id, data),
    onSuccess: (updatedCustomer: Customer) => {
      queryClient.setQueryData<Customer>(['customers', updatedCustomer.id], updatedCustomer);
      queryClient.setQueryData<Customer[]>(['customers'], (old = []) => 
        old.map(customer => customer.id === updatedCustomer.id ? updatedCustomer : customer)
      );
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.customers.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: ['customers', id] });
      queryClient.setQueryData<Customer[]>(['customers'], (old = []) => 
        old.filter(customer => customer.id !== id)
      );
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });
};
