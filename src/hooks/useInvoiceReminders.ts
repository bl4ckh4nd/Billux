import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, orpc } from '../lib/api';
import type { Reminder, ReminderLevel } from '../types/reminder';

export const useInvoiceReminders = (invoiceId: string | undefined) => {
  return useQuery({
    ...orpc.reminders.getByInvoice.queryOptions({
      input: invoiceId ? { invoiceId } : undefined,
      enabled: !!invoiceId,
      initialData: [] as Reminder[],
      staleTime: 30000
    })
  });
};

export const useCreateReminder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, level }: { invoiceId: string; level: ReminderLevel }) => 
      api.reminders.create(invoiceId, level),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: orpc.reminders.getByInvoice.queryKey({ input: { invoiceId: variables.invoiceId } })
      });
      queryClient.invalidateQueries({ queryKey: orpc.invoices.get.queryKey({ input: { id: variables.invoiceId } }) });
      queryClient.invalidateQueries({ queryKey: orpc.invoices.getAll.queryKey() });
    },
  });
};

export const useSendReminder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, reminderData }: { 
      invoiceId: string; 
      reminderData: {
        level: ReminderLevel;
        dueDate: string;
        reminderFee: number;
        interestAmount: number;
        message?: string;
      }
    }) => api.reminders.create(invoiceId, reminderData.level),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: orpc.reminders.getByInvoice.queryKey({ input: { invoiceId: variables.invoiceId } })
      });
      queryClient.invalidateQueries({ queryKey: orpc.invoices.get.queryKey({ input: { id: variables.invoiceId } }) });
      queryClient.invalidateQueries({ queryKey: orpc.invoices.getAll.queryKey() });
      queryClient.invalidateQueries({ queryKey: ['reminder-stats', 'invoice', variables.invoiceId] });
    },
  });
};

export const useReminderStats = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ['reminder-stats', 'invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      const reminders = await orpc.reminders.getByInvoice.call({ invoiceId });
      const invoice = await orpc.invoices.get.call({ id: invoiceId });
      
      if (!invoice) return null;
      
      // Calculate reminder statistics
      const totalFees = reminders.reduce((sum, r) => sum + r.reminderFee, 0);
      const totalInterest = reminders.reduce((sum, r) => sum + r.interestAmount, 0);
      
      const remindersByLevel = reminders.reduce((acc, r) => {
        acc[r.level] = (acc[r.level] || 0) + 1;
        return acc;
      }, {} as Record<ReminderLevel, number>);
      
      const lastReminder = reminders.length > 0 
        ? reminders.sort((a, b) => new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime())[0]
        : null;
      
      return {
        totalReminders: reminders.length,
        totalFees,
        totalInterest,
        totalAdditionalCharges: totalFees + totalInterest,
        remindersByLevel,
        lastReminder,
        nextReminderLevel: getNextReminderLevel(lastReminder?.level),
        daysSinceLastReminder: lastReminder 
          ? Math.floor((Date.now() - new Date(lastReminder.sentDate).getTime()) / (1000 * 60 * 60 * 24))
          : null
      };
    },
    enabled: !!invoiceId,
    staleTime: 30000,
  });
};

function getNextReminderLevel(currentLevel?: ReminderLevel): ReminderLevel | null {
  if (!currentLevel) return ReminderLevel.FRIENDLY;
  
  switch (currentLevel) {
    case ReminderLevel.FRIENDLY:
      return ReminderLevel.FIRST_REMINDER;
    case ReminderLevel.FIRST_REMINDER:
      return ReminderLevel.SECOND_REMINDER;
    case ReminderLevel.SECOND_REMINDER:
      return ReminderLevel.FINAL_NOTICE;
    case ReminderLevel.FINAL_NOTICE:
      return null; // No further escalation
    default:
      return null;
  }
}