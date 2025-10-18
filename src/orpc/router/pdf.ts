import { os } from '@orpc/server';
import { z } from 'zod';
import { mockApi } from '../server/mockApi';
import type { PdfGenerationOptions, PdfPreviewData } from '../../types/pdf';

const pdfOptionsSchema = z.object({
  template: z.literal('invoice'),
  documentId: z.string(),
  language: z.string(),
  includeZugferd: z.boolean().optional()
});

export const preview = os
  .input(pdfOptionsSchema)
  .handler(async ({ input }): Promise<PdfPreviewData & { component: unknown }> => {
    return mockApi.pdf.preview(input as PdfGenerationOptions);
  });

export const download = os
  .input(pdfOptionsSchema)
  .handler(async ({ input }): Promise<Uint8Array | Blob> => {
    return mockApi.pdf.download(input as PdfGenerationOptions);
  });
