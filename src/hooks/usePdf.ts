import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Invoice } from '../types/invoice';

export const usePdfGeneration = (invoice: Invoice) => {
  return useQuery({
    queryKey: ['pdf', invoice.id],
    queryFn: async () => {
      console.log('Generating PDF preview for invoice:', invoice.id);
      try {
        const result = await api.pdf.preview({
          template: 'invoice',
          documentId: invoice.id,
          language: 'de'
        });
        console.log('PDF preview generated successfully');
        return result;
      } catch (error) {
        console.error('Error generating PDF preview:', error);
        throw error;
      }
    },
    enabled: !!invoice?.id, // Only run query if invoice exists
  });
};

export const useDownloadPdf = () => {
  return useMutation({
    mutationFn: async (invoice: Invoice) => {
      console.log('Downloading PDF for invoice:', invoice.id);
      try {
        const pdfBlob = await api.pdf.download({
          template: 'invoice',
          documentId: invoice.id,
          language: 'de'
        });
        
        // Create download link
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.number}.pdf`;
        a.click();
        
        // Clean up
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 1000);
        
        console.log('PDF downloaded successfully');
      } catch (error) {
        console.error('Error downloading PDF:', error);
        throw error;
      }
    }
  });
};
