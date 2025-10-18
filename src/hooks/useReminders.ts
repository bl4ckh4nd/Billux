import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, orpc } from '../lib/api';
import { ReminderLevel, ReminderStatus } from '../types/reminder';

export function useOverdueInvoices() {
  return useQuery({
    ...orpc.reminders.getOverdueInvoices.queryOptions()
  });
}

export function useReminders(invoiceId?: string) {
  if (invoiceId) {
    return useQuery({
      ...orpc.reminders.getByInvoice.queryOptions({ input: { invoiceId } })
    });
  }

  return useQuery({
    ...orpc.reminders.getAll.queryOptions()
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, level }: { invoiceId: string; level: ReminderLevel }) =>
      api.reminders.create(invoiceId, level),
    onSuccess: (reminder) => {
      queryClient.invalidateQueries({ queryKey: orpc.reminders.getAll.queryKey() });
      queryClient.invalidateQueries({ queryKey: orpc.reminders.getByInvoice.queryKey({ input: { invoiceId: reminder.invoiceId } }) });
      queryClient.invalidateQueries({ queryKey: orpc.reminders.getOverdueInvoices.queryKey() });
      queryClient.invalidateQueries({ queryKey: orpc.invoices.getAll.queryKey() });
    },
  });
}

export function useSendReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reminderId: string) => api.reminders.send(reminderId),
    onSuccess: (reminder) => {
      queryClient.invalidateQueries({ queryKey: orpc.reminders.getAll.queryKey() });
      queryClient.invalidateQueries({ queryKey: orpc.reminders.getByInvoice.queryKey({ input: { invoiceId: reminder.invoiceId } }) });
    },
  });
}

export function useUpdateReminderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reminderId, status }: { reminderId: string; status: ReminderStatus }) =>
      api.reminders.updateStatus(reminderId, status),
    onSuccess: (reminder) => {
      queryClient.invalidateQueries({ queryKey: orpc.reminders.getAll.queryKey() });
      queryClient.invalidateQueries({ queryKey: orpc.reminders.getByInvoice.queryKey({ input: { invoiceId: reminder.invoiceId } }) });
      queryClient.invalidateQueries({ queryKey: orpc.invoices.getAll.queryKey() });
    },
  });
}

export function useReminderStatistics() {
  return useQuery({
    ...orpc.reminders.getStatistics.queryOptions()
  });
}

export function useReminderTemplates() {
  return useQuery({
    ...orpc.reminders.getTemplates.queryOptions()
  });
}

// Helper hook to get reminder info for a specific invoice
export function useInvoiceReminders(invoiceId: string) {
  const { data: reminders, isLoading: remindersLoading } = useReminders(invoiceId);
  const { data: invoice } = useQuery({
    ...orpc.invoices.get.queryOptions({ input: { id: invoiceId } })
  });

  const canSendReminder = (level: ReminderLevel): boolean => {
    if (!invoice || !reminders) return false;
    
    // Check if invoice is eligible
    if (invoice.status === 'Bezahlt' || invoice.status === 'Entwurf') return false;
    
    // Check if this level has already been sent
    const existingAtLevel = reminders.find(r => r.level === level);
    if (existingAtLevel) return false;
    
    // Check if previous levels have been sent (sequential requirement)
    if (level > ReminderLevel.FRIENDLY) {
      const previousLevel = level - 1;
      const previousReminder = reminders.find(r => r.level === previousLevel);
      if (!previousReminder) return false;
    }
    
    return true;
  };

  const nextReminderLevel = (): ReminderLevel | null => {
    if (!invoice || !reminders) return null;
    
    if (reminders.length === 0) return ReminderLevel.FRIENDLY;
    
    const highestLevel = Math.max(...reminders.map(r => r.level));
    if (highestLevel < ReminderLevel.LEGAL_ACTION) {
      return (highestLevel + 1) as ReminderLevel;
    }
    
    return null;
  };

  return {
    reminders,
    remindersLoading,
    canSendReminder,
    nextReminderLevel,
    reminderHistory: invoice?.reminderHistory || [],
    totalReminderFees: invoice?.totalReminderFees || 0,
    reminderStatus: invoice?.reminderStatus || 'none',
  };
}