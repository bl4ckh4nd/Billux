import { ReminderLevel } from './reminder';

export type PaymentMethod = 'bank' | 'cash' | 'card' | 'online_card' | 'online_paypal' | 'online_sepa';
export type InvoiceStatus = 'Bezahlt' | 'Offen' | 'Überfällig' | 'Teilweise bezahlt' | 'Entwurf';
export type EmailStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  invoiceId: string;
  gatewayTransactionId?: string; // For online payments
  gatewayProvider?: 'stripe' | 'paypal';
  gatewayMetadata?: Record<string, any>;
}

export interface EmailActivity {
  id: string;
  type: 'invoice_sent' | 'payment_reminder' | 'payment_confirmation';
  sentAt: string;
  status: EmailStatus;
  recipient: string;
  subject: string;
  errorMessage?: string;
  messageId?: string; // Provider message ID
  openedAt?: string;
  clickedAt?: string;
}

export type InvoiceType = 'Standard' | 'Abschlag' | 'Schlussrechnung' | 'Storno' | 'Gutschrift';

export interface Invoice {
  id: string;
  number: string;
  date: string;
  customer: string;
  customerId?: string; // Customer ID reference
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAmount: number;
  payments: Payment[];
  type: InvoiceType;
  projectId?: string;  // Link to associated project
  previousInvoices?: string[];  // References to previous invoices for the project
  paymentLink?: string; // URL for online payment
  paymentLinkToken?: string; // Secure token for payment verification
  paymentLinkExpiresAt?: string; // Payment link expiration
  emailActivities: EmailActivity[]; // Email sending history
  lastEmailSentAt?: string; // Quick reference to last email
  // Reminder-related fields
  reminderHistory?: {
    level: ReminderLevel;
    sentDate: string;
    dueDate: string;
    fee: number;
    status: 'sent' | 'acknowledged' | 'paid';
  }[];
  lastReminderLevel?: ReminderLevel;
  lastReminderDate?: string;
  totalReminderFees?: number;
  reminderStatus?: 'none' | 'active' | 'escalated' | 'resolved';
  metadata?: {
    relatedInvoiceId?: string;
    relatedInvoiceNumber?: string;
    relatedInvoiceAmount?: number;
    stornoReason?: string;
  };
  // Additional enriched fields (populated by hooks)
  customerData?: any; // Full customer object
  projectData?: any; // Full project object
  daysUntilDue?: number;
  isOverdue?: boolean;
}

export interface CreateInvoiceDTO {
  number: string;
  date: string;
  customerId: string;
  projectId?: string;  // Make project association optional
  items: Array<{
    articleId: string;
    quantity: number;
    unitPrice: number;
  }>;
  dueDate: string;
  retentionFee: number;
  type: InvoiceType;
  previousInvoiceIds?: string[];
  metadata?: {
    relatedInvoiceId?: string;
    stornoReason?: string;
  };
}

export interface CreatePaymentDTO {
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  invoiceId: string;
}
