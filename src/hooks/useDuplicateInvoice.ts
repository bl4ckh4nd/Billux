import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Invoice } from '../types/invoice';

export const useDuplicateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, data }: { 
      invoiceId: string; 
      data?: {
        date?: string;
        dueDate?: string;
        projectId?: string;
      }
    }) => {
      const invoice = await api.invoices.get(invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      // Generate new invoice number
      const invoices = await api.invoices.getAll();
      const currentYear = new Date().getFullYear();
      const yearInvoices = invoices.filter(inv => 
        inv.number.startsWith(`${currentYear}-`)
      );
      const nextNumber = yearInvoices.length + 1;
      const newInvoiceNumber = `${currentYear}-${String(nextNumber).padStart(4, '0')}`;

      // Create duplicate with new data
      const newInvoice: Partial<Invoice> = {
        ...invoice,
        id: `inv-${Date.now()}`,
        number: newInvoiceNumber,
        date: data?.date || new Date().toISOString(),
        dueDate: data?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Offen',
        paidAmount: 0,
        payments: [],
        projectId: data?.projectId || invoice.projectId,
        metadata: {
          ...invoice.metadata,
          duplicatedFrom: invoice.id,
          duplicatedFromNumber: invoice.number
        },
        // Reset email and reminder data
        emailActivities: [],
        lastEmailSentAt: undefined,
        reminderHistory: [],
        lastReminderLevel: undefined,
        lastReminderDate: undefined,
        totalReminderFees: 0,
        reminderStatus: 'none'
      };

      // Create the duplicate invoice
      return api.invoices.create(newInvoice);
    },
    onSuccess: (newInvoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.setQueryData(['invoice', newInvoice.id], newInvoice);
    }
  });
};