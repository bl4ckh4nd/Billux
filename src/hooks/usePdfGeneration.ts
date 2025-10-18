import { useQuery, useMutation } from '@tanstack/react-query';
import type { PdfGenerationOptions, PdfPreviewData } from '../types/pdf';
import type { Invoice } from '../types/invoice';
import { api, orpc } from '../lib/api';

export const usePdfPreview = (options: PdfGenerationOptions) => {
  const baseOptions = orpc.pdf.preview.queryOptions({ input: options });

  return useQuery({
    ...baseOptions,
    queryFn: async ctx => {
      console.log('PDF Preview Request:', { options });

      try {
        const data = await baseOptions.queryFn(ctx);
        console.log('PDF Preview Response:', data);
        return data;
      } catch (error) {
        console.error('PDF Preview Error:', error);
        throw error;
      }
    }
  });
};

export const useDownloadPdf = () => {
  return useMutation({
    mutationFn: async (options: PdfGenerationOptions) => {
      const data = await api.pdf.download(options);
      // Handle ReadableStream response
      const arrayBuffer = await new Response(data).arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${options.documentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });
};

// Update hook to include ZuGFERD option
export const usePdfGeneration = (invoice: Invoice, includeZugferd = true) => {
  return useQuery({
    queryKey: ['pdf', invoice.id, includeZugferd],
    queryFn: async () => {
      console.log(`Generating PDF ${includeZugferd ? 'with' : 'without'} ZuGFERD for invoice:`, invoice.id);
      try {
        const result = await orpc.pdf.preview.call({
          template: 'invoice',
          documentId: invoice.id,
          language: 'de',
          includeZugferd
        });
        return result;
      } catch (error) {
        console.error('Error generating PDF preview:', error);
        throw error;
      }
    },
    enabled: !!invoice?.id,
  });
};
