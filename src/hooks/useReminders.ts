import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { ReminderLevel, ReminderStatus } from '../types/reminder';

export function useOverdueInvoices() {
  return useQuery({
    queryKey: ['overdue-invoices'],
    queryFn: api.reminders.getOverdueInvoices,
  });
}

export function useReminders(invoiceId?: string) {
  return useQuery({
    queryKey: ['reminders', invoiceId],
    queryFn: () => invoiceId ? api.reminders.getByInvoice(invoiceId) : api.reminders.getAll(),
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, level }: { invoiceId: string; level: ReminderLevel }) =>
      api.reminders.create(invoiceId, level),
    onSuccess: (reminder) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminders', reminder.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['overdue-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useSendReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reminderId: string) => api.reminders.send(reminderId),
    onSuccess: (reminder) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminders', reminder.invoiceId] });
    },
  });
}

export function useUpdateReminderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reminderId, status }: { reminderId: string; status: ReminderStatus }) =>
      api.reminders.updateStatus(reminderId, status),
    onSuccess: (reminder) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminders', reminder.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useReminderStatistics() {
  return useQuery({
    queryKey: ['reminder-statistics'],
    queryFn: api.reminders.getStatistics,
  });
}

export function useReminderTemplates() {
  return useQuery({
    queryKey: ['reminder-templates'],
    queryFn: api.reminders.getTemplates,
  });
}

// Helper hook to get reminder info for a specific invoice
export function useInvoiceReminders(invoiceId: string) {
  const { data: reminders, isLoading: remindersLoading } = useReminders(invoiceId);
  const { data: invoice } = useQuery({
    queryKey: ['invoices', invoiceId],
    queryFn: () => api.invoices.get(invoiceId),
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