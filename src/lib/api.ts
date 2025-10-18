import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/message-port';
import { createRouterClient, type RouterClient } from '@orpc/server';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';
import { router, type AppRouter } from '../orpc/router';
import { DEFAULT_CLIENT_EVENT } from '../orpc/electron/preload';
import type {
  Invoice,
  CreateInvoiceDTO,
  Payment,
  CreatePaymentDTO,
} from '../types/invoice';
import type { Customer, CreateCustomerDTO } from '../types/customer';
import type { Project, CreateProjectDTO } from '../types/project';
import type { Article, CreateArticleDTO, UpdateArticleDTO } from '../types/article';
import type { CompanySettings } from '../types/settings';
import type { PdfGenerationOptions, PdfPreviewData } from '../types/pdf';
import type { Reminder, ReminderStatistics, ReminderTemplate } from '../types/reminder';
import { ReminderLevel, ReminderStatus } from '../types/reminder';
import type { UploadedDocument, ProcessingStatus } from '../types/upload';

const processWithType = typeof process !== 'undefined'
  ? (process as unknown as { type?: string; versions?: typeof process.versions })
  : undefined;

const isElectronRenderer =
  typeof window !== 'undefined' &&
  !!processWithType?.versions?.electron &&
  processWithType?.type === 'renderer';

const createClient = (): RouterClient<AppRouter> => {
  if (isElectronRenderer) {
    const { port1, port2 } = new MessageChannel();
    window.postMessage(DEFAULT_CLIENT_EVENT, '*', [port2]);

    const link = new RPCLink({ port: port1 });
    port1.start();

    return createORPCClient(link);
  }

  return createRouterClient(router);
};

export const client = createClient();
export const orpc = createTanstackQueryUtils(client);

export const api = {
  invoices: {
    getAll: async (): Promise<Invoice[]> => orpc.invoices.getAll.call(),
    get: async (id: string): Promise<Invoice | undefined> =>
      orpc.invoices.get.call({ id }),
    getByCustomer: async (customerName: string): Promise<Invoice[]> =>
      orpc.invoices.getByCustomer.call({ customerName }),
    getByProject: async (projectId: string): Promise<Invoice[]> =>
      orpc.invoices.getByProject.call({ projectId }),
    create: async (data: CreateInvoiceDTO): Promise<Invoice> =>
      orpc.invoices.create.call(data),
    addPayment: async (invoiceId: string, payment: CreatePaymentDTO): Promise<Payment> =>
      orpc.invoices.addPayment.call({ invoiceId, payment }),
    getPayments: async (id: string): Promise<Payment[]> =>
      orpc.invoices.getPayments.call({ id }),
    update: async (id: string, data: Partial<Invoice>): Promise<Invoice> =>
      orpc.invoices.update.call({ id, data }),
    delete: async (id: string): Promise<void> =>
      orpc.invoices.delete.call({ id }),
  },
  customers: {
    getAll: async (): Promise<Customer[]> => orpc.customers.getAll.call(),
    getById: async (id: string): Promise<Customer | undefined> =>
      orpc.customers.getById.call({ id }),
    create: async (data: CreateCustomerDTO): Promise<Customer> =>
      orpc.customers.create.call(data),
    update: async (id: string, data: Partial<Customer>): Promise<Customer> =>
      orpc.customers.update.call({ id, data }),
    delete: async (id: string): Promise<void> =>
      orpc.customers.delete.call({ id }),
  },
  projects: {
    getAll: async (): Promise<Project[]> => orpc.projects.getAll.call(),
    get: async (id: string): Promise<Project | undefined> =>
      orpc.projects.get.call({ id }),
    getByCustomer: async (customerId: string): Promise<Project[]> =>
      orpc.projects.getByCustomer.call({ customerId }),
    create: async (data: CreateProjectDTO): Promise<Project> =>
      orpc.projects.create.call(data),
    update: async (id: string, data: Partial<Project>): Promise<Project> =>
      orpc.projects.update.call({ id, data }),
    delete: async (id: string): Promise<void> =>
      orpc.projects.delete.call({ id }),
  },
  articles: {
    getAll: async (): Promise<Article[]> => orpc.articles.getAll.call(),
    get: async (id: string): Promise<Article | undefined> =>
      orpc.articles.get.call({ id }),
    create: async (data: CreateArticleDTO): Promise<Article> =>
      orpc.articles.create.call(data),
    update: async (id: string, data: UpdateArticleDTO): Promise<Article> =>
      orpc.articles.update.call({ id, data }),
    delete: async (id: string): Promise<void> =>
      orpc.articles.delete.call({ id }),
  },
  payments: {
    getAll: async (): Promise<Payment[]> => orpc.payments.getAll.call(),
    getByCustomer: async (customerName: string): Promise<Payment[]> =>
      orpc.payments.getByCustomer.call({ customerName }),
  },
  settings: {
    get: async (): Promise<CompanySettings> => orpc.settings.get.call(),
    update: async (data: Partial<CompanySettings>): Promise<CompanySettings> =>
      orpc.settings.update.call({ data }),
  },
  pdf: {
    preview: async (options: PdfGenerationOptions): Promise<PdfPreviewData & { component: unknown }> =>
      orpc.pdf.preview.call(options),
    download: async (options: PdfGenerationOptions): Promise<Uint8Array | Blob> =>
      orpc.pdf.download.call(options),
  },
  reminders: {
    getOverdueInvoices: async (): Promise<Invoice[]> =>
      orpc.reminders.getOverdueInvoices.call(),
    getByInvoice: async (invoiceId: string): Promise<Reminder[]> =>
      orpc.reminders.getByInvoice.call({ invoiceId }),
    getAll: async (): Promise<Reminder[]> => orpc.reminders.getAll.call(),
    create: async (invoiceId: string, level: ReminderLevel): Promise<Reminder> =>
      orpc.reminders.create.call({ invoiceId, level }),
    send: async (reminderId: string): Promise<Reminder> =>
      orpc.reminders.send.call({ reminderId }),
    updateStatus: async (reminderId: string, status: ReminderStatus): Promise<Reminder> =>
      orpc.reminders.updateStatus.call({ reminderId, status }),
    getStatistics: async (): Promise<ReminderStatistics> =>
      orpc.reminders.getStatistics.call(),
    getTemplates: async (): Promise<ReminderTemplate[]> =>
      orpc.reminders.getTemplates.call(),
  },
  upload: {
    uploadFile: async (file: File): Promise<UploadedDocument> =>
      orpc.upload.uploadFile.call({ file }),
    getDocuments: async (): Promise<UploadedDocument[]> =>
      orpc.upload.getDocuments.call(),
    getDocument: async (documentId: string): Promise<UploadedDocument> =>
      orpc.upload.getDocument.call({ documentId }),
    processDocument: async (documentId: string): Promise<UploadedDocument> =>
      orpc.upload.processDocument.call({ documentId }),
    deleteDocument: async (documentId: string): Promise<void> =>
      orpc.upload.deleteDocument.call({ documentId }),
    updateDocument: async (
      documentId: string,
      updates: Partial<UploadedDocument>
    ): Promise<UploadedDocument> => orpc.upload.updateDocument.call({ documentId, updates }),
    createInvoiceFromDocument: async (documentId: string): Promise<Invoice> =>
      orpc.upload.createInvoiceFromDocument.call({ documentId }),
    getProcessingStatus: async (documentId: string): Promise<ProcessingStatus> =>
      orpc.upload.getProcessingStatus.call({ documentId }),
    uploadFiles: async (files: File[]): Promise<UploadedDocument[]> =>
      orpc.upload.uploadFiles.call({ files }),
  },
};
