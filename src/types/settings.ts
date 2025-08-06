import { ReminderSettings } from './reminder';

export interface CompanySettings {
  name: string;
  address: string;
  taxId: string;
  vatId: string;
  email: string;
  phone: string;
  website: string;
  logo?: string;
  bankDetails: {
    accountHolder: string;
    iban: string;
    bic: string;
    bankName: string;
  };
  invoiceSettings: {
    numberPrefix: string;
    nextNumber: number;
    defaultDueDays: number;
    defaultTaxRate: number;
    defaultPaymentTerms: string;
  };
  paymentSettings: {
    enableOnlinePayments: boolean;
    stripePublishableKey?: string;
    stripeSecretKey?: string;
    paypalClientId?: string;
    paypalClientSecret?: string;
    paymentPageUrl?: string;
    acceptedPaymentMethods: ('card' | 'paypal' | 'sepa')[];
  };
  emailSettings: {
    enableEmailSending: boolean;
    provider: 'resend' | 'sendgrid' | 'smtp';
    resendApiKey?: string;
    sendgridApiKey?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    fromEmail: string;
    fromName: string;
    replyToEmail?: string;
    emailTemplates: {
      invoiceSubject: string;
      invoiceBody: string;
      paymentReminderSubject: string;
      paymentReminderBody: string;
    };
  };
  reminderSettings?: ReminderSettings;
}
