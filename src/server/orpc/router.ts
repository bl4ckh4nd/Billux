import { InvoiceParser } from '../../services/invoiceParser';
import { businessRuleEngine } from '../../services/businessRuleEngine';
import type { ParsedInvoiceData, ValidationError } from '../../types/upload';

export interface HealthcheckResult {
  status: 'ok';
  timestamp: string;
}

const parser = new InvoiceParser();

export const appRouter = {
  diagnostics: {
    healthcheck: async (): Promise<HealthcheckResult> => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }),
  },
  invoices: {
    parseFromOcr: async (ocrText: string): Promise<ParsedInvoiceData> => parser.parseInvoice(ocrText),
    validate: async (invoice: ParsedInvoiceData): Promise<ValidationError[]> =>
      businessRuleEngine.validateInvoice(invoice),
  },
};

export type AppRouter = typeof appRouter;
