import { os } from '@orpc/server';
import { z } from 'zod';
import { mockApi } from '../server/mockApi';
import type { Invoice, CreateInvoiceDTO, Payment, CreatePaymentDTO } from '../../types/invoice';

const invoiceIdSchema = z.object({ id: z.string() });
const customerNameSchema = z.object({ customerName: z.string() });
const projectIdSchema = z.object({ projectId: z.string() });

const invoiceItemSchema = z.object({
  articleId: z.string(),
  quantity: z.number(),
  unitPrice: z.number()
});

const createInvoiceSchema = z.object({
  number: z.string(),
  date: z.string(),
  customerId: z.string(),
  projectId: z.string().optional(),
  items: z.array(invoiceItemSchema),
  dueDate: z.string(),
  retentionFee: z.number(),
  type: z.enum(['Standard', 'Abschlag', 'Schlussrechnung', 'Storno', 'Gutschrift']),
  previousInvoiceIds: z.array(z.string()).optional(),
  metadata: z
    .object({
      relatedInvoiceId: z.string().optional(),
      stornoReason: z.string().optional()
    })
    .optional()
});

const paymentSchema = z.object({
  date: z.string(),
  amount: z.number(),
  method: z.enum(['bank', 'cash', 'card', 'online_card', 'online_paypal', 'online_sepa']),
  reference: z.string(),
  invoiceId: z.string()
});

export const getAll = os.handler(async (): Promise<Invoice[]> => {
  return mockApi.invoices.getAll();
});

export const get = os
  .input(invoiceIdSchema)
  .handler(async ({ input }): Promise<Invoice | undefined> => {
    return mockApi.invoices.get(input.id);
  });

export const getByCustomer = os
  .input(customerNameSchema)
  .handler(async ({ input }): Promise<Invoice[]> => {
    return mockApi.invoices.getByCustomer(input.customerName);
  });

export const getByProject = os
  .input(projectIdSchema)
  .handler(async ({ input }): Promise<Invoice[]> => {
    return mockApi.invoices.getByProject(input.projectId);
  });

export const create = os
  .input(createInvoiceSchema)
  .handler(async ({ input }): Promise<Invoice> => {
    return mockApi.invoices.create(input as CreateInvoiceDTO);
  });

const addPaymentSchema = z.object({
  invoiceId: z.string(),
  payment: paymentSchema
});

export const addPayment = os
  .input(addPaymentSchema)
  .handler(async ({ input }): Promise<Payment> => {
    return mockApi.invoices.addPayment(input.invoiceId, input.payment as CreatePaymentDTO);
  });

export const getPayments = os
  .input(invoiceIdSchema)
  .handler(async ({ input }): Promise<Payment[]> => {
    return mockApi.invoices.getPayments(input.id);
  });

const updateSchema = z.object({
  id: z.string(),
  data: z.any()
});

export const update = os
  .input(updateSchema)
  .handler(async ({ input }): Promise<Invoice> => {
    return mockApi.invoices.update(input.id, input.data);
  });

export const remove = os
  .input(invoiceIdSchema)
  .handler(async ({ input }): Promise<void> => {
    return mockApi.invoices.delete(input.id);
  });
