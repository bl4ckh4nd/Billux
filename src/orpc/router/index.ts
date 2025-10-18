import { os } from '@orpc/server';
import * as invoices from './invoices';
import * as customers from './customers';
import * as projects from './projects';
import * as articles from './articles';
import * as payments from './payments';
import * as settings from './settings';
import * as pdf from './pdf';
import * as reminders from './reminders';
import * as upload from './upload';

export const router = os.router({
  invoices: {
    getAll: invoices.getAll,
    get: invoices.get,
    getByCustomer: invoices.getByCustomer,
    getByProject: invoices.getByProject,
    create: invoices.create,
    addPayment: invoices.addPayment,
    getPayments: invoices.getPayments,
    update: invoices.update,
    delete: invoices.remove
  },
  customers: {
    getAll: customers.getAll,
    getById: customers.getById,
    create: customers.create,
    update: customers.update,
    delete: customers.remove
  },
  projects: {
    getAll: projects.getAll,
    get: projects.get,
    getByCustomer: projects.getByCustomer,
    create: projects.create,
    update: projects.update,
    delete: projects.remove
  },
  articles: {
    getAll: articles.getAll,
    get: articles.get,
    create: articles.create,
    update: articles.update,
    delete: articles.remove
  },
  payments: {
    getAll: payments.getAll,
    getByCustomer: payments.getByCustomer
  },
  settings: {
    get: settings.get,
    update: settings.update
  },
  pdf: {
    preview: pdf.preview,
    download: pdf.download
  },
  reminders: {
    getOverdueInvoices: reminders.getOverdueInvoices,
    getByInvoice: reminders.getByInvoice,
    getAll: reminders.getAll,
    create: reminders.create,
    send: reminders.send,
    updateStatus: reminders.updateStatus,
    getStatistics: reminders.getStatistics,
    getTemplates: reminders.getTemplates
  },
  upload: {
    uploadFile: upload.uploadFile,
    getDocuments: upload.getDocuments,
    getDocument: upload.getDocument,
    processDocument: upload.processDocument,
    deleteDocument: upload.deleteDocument,
    updateDocument: upload.updateDocument,
    createInvoiceFromDocument: upload.createInvoiceFromDocument,
    getProcessingStatus: upload.getProcessingStatus,
    uploadFiles: upload.uploadFiles
  }
});

export type AppRouter = typeof router;
