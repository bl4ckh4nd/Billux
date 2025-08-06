import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Invoice } from '../types/invoice';

export const useInvoice = (invoiceId: string | undefined) => {
  return useQuery<Invoice | undefined, Error>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return undefined;
      
      const invoice = await api.invoices.get(invoiceId);
      if (!invoice) return undefined;
      
      // Enrich invoice data with additional information
      const enrichedInvoice = { ...invoice };
      
      // Add customer details if available
      if (invoice.customerId) {
        const customer = await api.customers.getById(invoice.customerId);
        if (customer) {
          enrichedInvoice.customerData = customer;
        }
      }
      
      // Add project details if available
      if (invoice.projectId) {
        const project = await api.projects.get(invoice.projectId);
        if (project) {
          enrichedInvoice.projectData = project;
        }
      }
      
      // Calculate days overdue/until due
      const today = new Date();
      const dueDate = new Date(invoice.dueDate);
      const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      enrichedInvoice.daysUntilDue = daysUntilDue;
      enrichedInvoice.isOverdue = daysUntilDue < 0 && invoice.status !== 'Bezahlt';
      
      return enrichedInvoice;
    },
    enabled: !!invoiceId,
    staleTime: 30000, // 30 seconds
  });
};