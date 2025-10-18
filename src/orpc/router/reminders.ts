import { os } from '@orpc/server';
import { z } from 'zod';
import { mockApi } from '../server/mockApi';
import type { Reminder, ReminderStatistics, ReminderTemplate } from '../../types/reminder';
import { ReminderLevel, ReminderStatus } from '../../types/reminder';
import type { Invoice } from '../../types/invoice';

const invoiceIdSchema = z.object({ invoiceId: z.string() });
const reminderIdSchema = z.object({ reminderId: z.string() });

export const getOverdueInvoices = os.handler(async (): Promise<Invoice[]> => {
  return mockApi.reminders.getOverdueInvoices();
});

export const getByInvoice = os
  .input(invoiceIdSchema)
  .handler(async ({ input }): Promise<Reminder[]> => {
    return mockApi.reminders.getByInvoice(input.invoiceId);
  });

export const getAll = os.handler(async (): Promise<Reminder[]> => {
  return mockApi.reminders.getAll();
});

const createSchema = z.object({
  invoiceId: z.string(),
  level: z.nativeEnum(ReminderLevel)
});

export const create = os
  .input(createSchema)
  .handler(async ({ input }): Promise<Reminder> => {
    return mockApi.reminders.create(input.invoiceId, input.level);
  });

export const send = os
  .input(reminderIdSchema)
  .handler(async ({ input }): Promise<Reminder> => {
    return mockApi.reminders.send(input.reminderId);
  });

const updateStatusSchema = z.object({
  reminderId: z.string(),
  status: z.nativeEnum(ReminderStatus)
});

export const updateStatus = os
  .input(updateStatusSchema)
  .handler(async ({ input }): Promise<Reminder> => {
    return mockApi.reminders.updateStatus(input.reminderId, input.status);
  });

export const getStatistics = os.handler(async (): Promise<ReminderStatistics> => {
  return mockApi.reminders.getStatistics();
});

export const getTemplates = os.handler(async (): Promise<ReminderTemplate[]> => {
  return mockApi.reminders.getTemplates();
});
