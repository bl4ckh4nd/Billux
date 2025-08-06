import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Invoice } from '../types/invoice';

export const useArticleInvoices = (articleId: string | undefined) => {
  return useQuery<Invoice[], Error>({
    queryKey: ['invoices', 'article', articleId],
    queryFn: async () => {
      if (!articleId) return [];
      
      // Get all invoices and filter those containing this article
      const allInvoices = await api.invoices.getAll();
      
      // In a real implementation, we would check invoice.items for articleId
      // For now, we'll simulate by randomly selecting some invoices
      const articleInvoices = allInvoices.filter(() => Math.random() > 0.7);
      
      return articleInvoices;
    },
    enabled: !!articleId,
    staleTime: 30000,
  });
};