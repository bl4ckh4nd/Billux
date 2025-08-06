import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EmailActivity, EmailStatus } from '../types/invoice';

interface SendInvoiceEmailData {
  invoiceId: string;
  recipientEmail: string;
  recipientName?: string;
  subject?: string;
  includePaymentLink?: boolean;
  customMessage?: string;
}

interface EmailResponse {
  id: string;
  messageId: string;
  status: EmailStatus;
  sentAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'invoice' | 'reminder' | 'confirmation';
}

// Mock API functions - replace with actual API calls
const sendInvoiceEmail = async (data: SendInvoiceEmailData): Promise<EmailResponse> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulate occasional failure
  if (Math.random() < 0.1) {
    throw new Error('Failed to send email: SMTP connection failed');
  }
  
  return {
    id: `email_${Math.random().toString(36).substr(2, 9)}`,
    messageId: `msg_${Math.random().toString(36).substr(2, 16)}`,
    status: 'sent' as EmailStatus,
    sentAt: new Date().toISOString(),
  };
};

const getEmailActivities = async (invoiceId: string): Promise<EmailActivity[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock email activities
  const activities: EmailActivity[] = [];
  const count = Math.floor(Math.random() * 3) + 1;
  
  for (let i = 0; i < count; i++) {
    const sentAt = new Date();
    sentAt.setDate(sentAt.getDate() - i * 7);
    
    activities.push({
      id: `activity_${Math.random().toString(36).substr(2, 9)}`,
      type: i === 0 ? 'invoice_sent' : 'payment_reminder',
      sentAt: sentAt.toISOString(),
      status: Math.random() > 0.1 ? 'delivered' : 'failed',
      recipient: 'kunde@example.com',
      subject: i === 0 ? 'Ihre Rechnung von Billux' : 'Zahlungserinnerung - Rechnung überfällig',
      messageId: `msg_${Math.random().toString(36).substr(2, 16)}`,
      openedAt: Math.random() > 0.3 ? new Date(sentAt.getTime() + 3600000).toISOString() : undefined,
    });
  }
  
  return activities.reverse();
};

const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    {
      id: 'invoice_default',
      name: 'Standard Rechnungsversand',
      type: 'invoice',
      subject: 'Ihre Rechnung {{invoiceNumber}} von {{companyName}}',
      body: `Sehr geehrte Damen und Herren,

anbei erhalten Sie die Rechnung {{invoiceNumber}} vom {{invoiceDate}} über {{amount}}.

Sie können diese Rechnung bequem online bezahlen:
{{paymentLink}}

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
{{companyName}}`,
    },
    {
      id: 'reminder_default',
      name: 'Standard Zahlungserinnerung',
      type: 'reminder',
      subject: 'Zahlungserinnerung - Rechnung {{invoiceNumber}}',
      body: `Sehr geehrte Damen und Herren,

die Rechnung {{invoiceNumber}} über {{amount}} ist seit dem {{dueDate}} überfällig.

Bitte begleichen Sie den offenen Betrag umgehend:
{{paymentLink}}

Falls Sie bereits bezahlt haben, betrachten Sie diese Nachricht als gegenstandslos.

Mit freundlichen Grüßen
{{companyName}}`,
    },
  ];
};

const testEmailConfiguration = async (): Promise<{ success: boolean; message: string }> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate test results
  const success = Math.random() > 0.2; // 80% success rate
  
  return {
    success,
    message: success 
      ? 'Email configuration test successful' 
      : 'Failed to connect to email provider: Invalid API key',
  };
};

export const useSendInvoiceEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sendInvoiceEmail,
    onSuccess: (data, variables) => {
      // Invalidate email activities for this invoice
      queryClient.invalidateQueries({ queryKey: ['emailActivities', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
    },
  });
};

export const useEmailActivities = (invoiceId: string) => {
  return useQuery({
    queryKey: ['emailActivities', invoiceId],
    queryFn: () => getEmailActivities(invoiceId),
    enabled: !!invoiceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useEmailTemplates = () => {
  return useQuery({
    queryKey: ['emailTemplates'],
    queryFn: getEmailTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useTestEmailConfiguration = () => {
  return useMutation({
    mutationFn: testEmailConfiguration,
  });
};