export enum ReminderLevel {
  FRIENDLY = 1,           // Zahlungserinnerung
  FIRST_REMINDER = 2,     // 1. Mahnung
  SECOND_REMINDER = 3,    // 2. Mahnung
  FINAL_NOTICE = 4,       // Letzte Mahnung
  LEGAL_ACTION = 5        // Rechtliche Schritte
}

export enum ReminderStatus {
  PENDING = 'pending',
  SENT = 'sent',
  ACKNOWLEDGED = 'acknowledged',
  PAID = 'paid',
  ESCALATED = 'escalated',
  CANCELLED = 'cancelled'
}

export interface ReminderFee {
  level: ReminderLevel;
  amount: number;
  description: string;
}

export interface Reminder {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  level: ReminderLevel;
  status: ReminderStatus;
  sentDate: string;
  dueDate: string;
  originalAmount: number;
  reminderFee: number;
  interestAmount: number;
  totalAmount: number;
  template: string;
  emailSubject: string;
  emailBody: string;
  attachments?: string[];
  response?: {
    date: string;
    type: 'payment' | 'dispute' | 'promise' | 'other';
    notes: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReminderSettings {
  enabled: boolean;
  automaticSending: boolean;
  // Days after invoice due date for each reminder level
  reminderSchedule: {
    friendly: number;        // e.g., 7 days
    firstReminder: number;   // e.g., 14 days
    secondReminder: number;  // e.g., 21 days
    finalNotice: number;     // e.g., 30 days
  };
  // Fees for each reminder level
  reminderFees: {
    firstReminder: number;   // e.g., 5.00 EUR
    secondReminder: number;  // e.g., 10.00 EUR
    finalNotice: number;     // e.g., 15.00 EUR
  };
  // Interest calculation
  interest: {
    enabled: boolean;
    rate: number;           // Annual percentage rate
    basePlusRate: number;   // Points above base rate
  };
  // Email templates for each level
  templates: {
    [key in ReminderLevel]?: {
      subject: string;
      body: string;
      attachOriginalInvoice: boolean;
      includeLegalText: boolean;
    };
  };
}

export interface ReminderHistory {
  invoiceId: string;
  reminders: Reminder[];
  lastReminderDate?: string;
  lastReminderLevel?: ReminderLevel;
  totalReminderFees: number;
  totalInterest: number;
  status: 'active' | 'paid' | 'escalated' | 'written_off';
}

export interface ReminderTemplate {
  level: ReminderLevel;
  name: string;
  subject: string;
  body: string;
  variables: string[]; // Available template variables
  legalText?: string;
  isDefault: boolean;
}

export interface ReminderStatistics {
  totalOverdue: number;
  totalAmount: number;
  byLevel: {
    level: ReminderLevel;
    count: number;
    amount: number;
  }[];
  byAge: {
    range: string; // e.g., "0-30", "31-60", "61-90", "90+"
    count: number;
    amount: number;
  }[];
  averageDaysOverdue: number;
  collectionRate: number;
}