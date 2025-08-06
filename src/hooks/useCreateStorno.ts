import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Invoice } from '../types/invoice';

export const useCreateStorno = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, reason }: { 
      invoiceId: string; 
      reason: string;
    }) => {
      const originalInvoice = await api.invoices.get(invoiceId);
      if (!originalInvoice) throw new Error('Invoice not found');
      
      if (originalInvoice.type === 'Storno') {
        throw new Error('Cannot create storno for a storno invoice');
      }

      // Generate storno invoice number
      const invoices = await api.invoices.getAll();
      const currentYear = new Date().getFullYear();
      const yearInvoices = invoices.filter(inv => 
        inv.number.startsWith(`${currentYear}-`)
      );
      const nextNumber = yearInvoices.length + 1;
      const stornoNumber = `${currentYear}-${String(nextNumber).padStart(4, '0')}-S`;

      // Create storno invoice with negative amounts
      const stornoInvoice: Partial<Invoice> = {
        id: `inv-${Date.now()}`,
        number: stornoNumber,
        date: new Date().toISOString(),
        customer: originalInvoice.customer,
        customerId: originalInvoice.customerId,
        amount: -originalInvoice.amount, // Negative amount
        status: 'Bezahlt', // Storno is automatically "paid"
        dueDate: new Date().toISOString(),
        paidAmount: -originalInvoice.amount,
        payments: [],
        type: 'Storno',
        projectId: originalInvoice.projectId,
        previousInvoices: [originalInvoice.id],
        metadata: {
          relatedInvoiceId: originalInvoice.id,
          relatedInvoiceNumber: originalInvoice.number,
          relatedInvoiceAmount: originalInvoice.amount,
          stornoReason: reason
        }
      };

      // Create the storno invoice
      const newStorno = await api.invoices.create(stornoInvoice);

      // Update original invoice status if fully paid
      if (originalInvoice.status === 'Bezahlt') {
        await api.invoices.update(originalInvoice.id, {
          status: 'Offen',
          paidAmount: 0
        });
      }

      return newStorno;
    },
    onSuccess: (newStorno, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      queryClient.setQueryData(['invoice', newStorno.id], newStorno);
    }
  });
};