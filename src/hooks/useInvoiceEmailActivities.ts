import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Invoice, EmailActivity, EmailStatus } from '../types/invoice';

// Mock email activities for now - in real implementation this would connect to email service
const mockEmailActivities: Record<string, EmailActivity[]> = {};

export const useInvoiceEmailActivities = (invoiceId: string | undefined) => {
  return useQuery<EmailActivity[], Error>({
    queryKey: ['email-activities', 'invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      
      // In real implementation, this would fetch from API
      return mockEmailActivities[invoiceId] || [];
    },
    enabled: !!invoiceId,
    staleTime: 30000,
  });
};

export const useSendInvoiceEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ invoiceId, recipient, subject, message }: {
      invoiceId: string;
      recipient: string;
      subject: string;
      message: string;
    }) => {
      // Mock implementation
      const newActivity: EmailActivity = {
        id: `email-${Date.now()}`,
        type: 'invoice_sent',
        sentAt: new Date().toISOString(),
        status: 'sent' as EmailStatus,
        recipient,
        subject,
      };
      
      if (!mockEmailActivities[invoiceId]) {
        mockEmailActivities[invoiceId] = [];
      }
      mockEmailActivities[invoiceId].push(newActivity);
      
      // Simulate email delivery status update
      setTimeout(() => {
        newActivity.status = 'delivered';
        queryClient.invalidateQueries({ queryKey: ['email-activities', 'invoice', invoiceId] });
      }, 2000);
      
      return newActivity;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-activities', 'invoice', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
    },
  });
};

export const useEmailStats = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ['email-stats', 'invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      const activities = mockEmailActivities[invoiceId] || [];
      
      const stats = {
        totalEmails: activities.length,
        delivered: activities.filter(a => a.status === 'delivered').length,
        opened: activities.filter(a => a.openedAt).length,
        clicked: activities.filter(a => a.clickedAt).length,
        failed: activities.filter(a => a.status === 'failed').length,
        lastEmailSent: activities.length > 0 
          ? activities.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0]
          : null,
        openRate: activities.length > 0 
          ? (activities.filter(a => a.openedAt).length / activities.length) * 100
          : 0,
        clickRate: activities.length > 0
          ? (activities.filter(a => a.clickedAt).length / activities.length) * 100
          : 0
      };
      
      return stats;
    },
    enabled: !!invoiceId,
    staleTime: 30000,
  });
};