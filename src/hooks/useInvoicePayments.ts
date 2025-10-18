import { useQuery } from '@tanstack/react-query';
import { orpc } from '../lib/api';
import type { Payment } from '../types/invoice';

export const useInvoicePayments = (invoiceId: string | undefined) => {
  return useQuery({
    ...orpc.invoices.getPayments.queryOptions({
      input: invoiceId ? { id: invoiceId } : undefined,
      enabled: !!invoiceId,
      initialData: [] as Payment[],
      staleTime: 30000
    })
  });
};

export const useInvoicePaymentStats = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ['payment-stats', 'invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      const payments = await orpc.invoices.getPayments.call({ id: invoiceId });
      const invoice = await orpc.invoices.get.call({ id: invoiceId });
      
      if (!invoice) return null;
      
      // Calculate payment statistics
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const paymentMethods = payments.reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Calculate average payment time
      let averagePaymentDays = 0;
      if (payments.length > 0 && invoice.status === 'Bezahlt') {
        const invoiceDate = new Date(invoice.date);
        const lastPaymentDate = new Date(Math.max(...payments.map(p => new Date(p.date).getTime())));
        averagePaymentDays = Math.floor((lastPaymentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      return {
        totalPaid,
        paymentCount: payments.length,
        remainingAmount: invoice.amount - totalPaid,
        paymentProgress: (totalPaid / invoice.amount) * 100,
        paymentMethods,
        averagePaymentDays,
        lastPaymentDate: payments.length > 0 
          ? new Date(Math.max(...payments.map(p => new Date(p.date).getTime()))).toISOString()
          : null
      };
    },
    enabled: !!invoiceId,
    staleTime: 30000,
  });
};