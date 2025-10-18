import { os } from '@orpc/server';
import { z } from 'zod';
import { mockApi } from '../server/mockApi';
import type { UploadedDocument, ProcessingStatus } from '../../types/upload';
import type { Invoice } from '../../types/invoice';

const documentIdSchema = z.object({ documentId: z.string() });

export const uploadFile = os
  .input(z.object({ file: z.any() }))
  .handler(async ({ input }): Promise<UploadedDocument> => {
    return mockApi.upload.uploadFile(input.file as File);
  });

export const getDocuments = os.handler(async (): Promise<UploadedDocument[]> => {
  return mockApi.upload.getDocuments();
});

export const getDocument = os
  .input(documentIdSchema)
  .handler(async ({ input }): Promise<UploadedDocument> => {
    return mockApi.upload.getDocument(input.documentId);
  });

export const processDocument = os
  .input(documentIdSchema)
  .handler(async ({ input }): Promise<UploadedDocument> => {
    return mockApi.upload.processDocument(input.documentId);
  });

export const deleteDocument = os
  .input(documentIdSchema)
  .handler(async ({ input }): Promise<void> => {
    return mockApi.upload.deleteDocument(input.documentId);
  });

const updateDocumentSchema = z.object({
  documentId: z.string(),
  updates: z.record(z.any())
});

export const updateDocument = os
  .input(updateDocumentSchema)
  .handler(async ({ input }): Promise<UploadedDocument> => {
    return mockApi.upload.updateDocument(input.documentId, input.updates as Partial<UploadedDocument>);
  });

export const createInvoiceFromDocument = os
  .input(documentIdSchema)
  .handler(async ({ input }): Promise<Invoice> => {
    return mockApi.upload.createInvoiceFromDocument(input.documentId);
  });

export const getProcessingStatus = os
  .input(documentIdSchema)
  .handler(async ({ input }): Promise<ProcessingStatus> => {
    return mockApi.upload.getProcessingStatus(input.documentId);
  });

export const uploadFiles = os
  .input(z.object({ files: z.array(z.any()) }))
  .handler(async ({ input }): Promise<UploadedDocument[]> => {
    return mockApi.upload.uploadFiles(input.files as File[]);
  });
