import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface PaymentLinkData {
  invoiceId: string;
  amount: number;
  expiresInDays?: number;
}

interface PaymentLinkResponse {
  id: string;
  url: string;
  token: string;
  expiresAt: string;
}

// Mock API functions - replace with actual API calls
const createPaymentLink = async (data: PaymentLinkData): Promise<PaymentLinkResponse> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const token = `pl_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 30));
  
  return {
    id: `link_${Math.random().toString(36).substr(2, 9)}`,
    url: `${window.location.origin}/pay/${token}`,
    token,
    expiresAt: expiresAt.toISOString(),
  };
};

const getPaymentLink = async (invoiceId: string): Promise<PaymentLinkResponse | null> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock check if payment link exists
  const hasLink = Math.random() > 0.3; // 70% chance of having a link
  
  if (!hasLink) return null;
  
  const token = `pl_${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 15);
  
  return {
    id: `link_${Math.random().toString(36).substr(2, 9)}`,
    url: `${window.location.origin}/pay/${token}`,
    token,
    expiresAt: expiresAt.toISOString(),
  };
};

const revokePaymentLink = async (invoiceId: string): Promise<void> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
};

export const useCreatePaymentLink = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPaymentLink,
    onSuccess: (data, variables) => {
      // Update invoice query cache with new payment link
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      queryClient.setQueryData(['paymentLink', variables.invoiceId], data);
    },
  });
};

export const usePaymentLink = (invoiceId: string) => {
  return useQuery({
    queryKey: ['paymentLink', invoiceId],
    queryFn: () => getPaymentLink(invoiceId),
    enabled: !!invoiceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useRevokePaymentLink = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: revokePaymentLink,
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['paymentLink', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
    },
  });
};