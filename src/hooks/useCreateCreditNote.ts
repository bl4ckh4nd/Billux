import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Invoice } from '../types/invoice';

export const useCreateCreditNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      amount,
      reason,
      items
    }: { 
      invoiceId: string; 
      amount: number;
      reason: string;
      items?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
      }>;
    }) => {
      const originalInvoice = await api.invoices.get(invoiceId);
      if (!originalInvoice) throw new Error('Invoice not found');
      
      if (originalInvoice.type === 'Gutschrift') {
        throw new Error('Cannot create credit note for a credit note');
      }

      // Validate amount
      if (amount > originalInvoice.amount) {
        throw new Error('Credit amount cannot exceed original invoice amount');
      }

      // Generate credit note number
      const invoices = await api.invoices.getAll();
      const currentYear = new Date().getFullYear();
      const yearInvoices = invoices.filter(inv => 
        inv.number.startsWith(`${currentYear}-`)
      );
      const nextNumber = yearInvoices.length + 1;
      const creditNoteNumber = `${currentYear}-${String(nextNumber).padStart(4, '0')}-G`;

      // Create credit note
      const creditNote: Partial<Invoice> = {
        id: `inv-${Date.now()}`,
        number: creditNoteNumber,
        date: new Date().toISOString(),
        customer: originalInvoice.customer,
        customerId: originalInvoice.customerId,
        amount: amount, // Positive amount for display
        status: 'Bezahlt', // Credit notes are automatically "paid"
        dueDate: new Date().toISOString(),
        paidAmount: amount,
        payments: [],
        type: 'Gutschrift',
        projectId: originalInvoice.projectId,
        previousInvoices: [originalInvoice.id],
        metadata: {
          relatedInvoiceId: originalInvoice.id,
          relatedInvoiceNumber: originalInvoice.number,
          relatedInvoiceAmount: originalInvoice.amount,
          creditReason: reason,
          creditItems: items
        }
      };

      // Create the credit note
      const newCreditNote = await api.invoices.create(creditNote);

      // Update original invoice if needed
      if (amount === originalInvoice.amount && originalInvoice.status === 'Bezahlt') {
        // Full credit - reopen invoice
        await api.invoices.update(originalInvoice.id, {
          status: 'Offen',
          paidAmount: 0
        });
      } else if (originalInvoice.paidAmount > 0) {
        // Partial credit - reduce paid amount
        const newPaidAmount = Math.max(0, originalInvoice.paidAmount - amount);
        await api.invoices.update(originalInvoice.id, {
          paidAmount: newPaidAmount,
          status: newPaidAmount === 0 ? 'Offen' : 
                  newPaidAmount < originalInvoice.amount ? 'Teilweise bezahlt' : 
                  'Bezahlt'
        });
      }

      return newCreditNote;
    },
    onSuccess: (newCreditNote, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      queryClient.setQueryData(['invoice', newCreditNote.id], newCreditNote);
    }
  });
};