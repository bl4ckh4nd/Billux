import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { EmailActivity } from '../types/invoice';

interface PaymentLink {
  id: string;
  invoiceId: string;
  url: string;
  token: string;
  expiresAt: string;
  isActive: boolean;
}

interface EmailSendState {
  isOpen: boolean;
  invoiceId: string | null;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  customMessage: string;
  includePaymentLink: boolean;
  templateId: string;
}

interface PaymentEmailState {
  // Payment Links
  paymentLinks: Record<string, PaymentLink>;
  
  // Email Activities
  emailActivities: Record<string, EmailActivity[]>;
  
  // Email Send Dialog
  emailSendState: EmailSendState;
  
  // Actions
  setPaymentLink: (invoiceId: string, link: PaymentLink | null) => void;
  setEmailActivities: (invoiceId: string, activities: EmailActivity[]) => void;
  addEmailActivity: (invoiceId: string, activity: EmailActivity) => void;
  
  // Email Dialog Actions
  openEmailDialog: (invoiceId: string, recipientEmail: string, recipientName?: string) => void;
  closeEmailDialog: () => void;
  updateEmailState: (updates: Partial<EmailSendState>) => void;
  resetEmailState: () => void;
  
  // Payment Link Actions
  generatePaymentLink: (invoiceId: string) => Promise<void>;
  revokePaymentLink: (invoiceId: string) => Promise<void>;
}

const defaultEmailSendState: EmailSendState = {
  isOpen: false,
  invoiceId: null,
  recipientEmail: '',
  recipientName: '',
  subject: '',
  customMessage: '',
  includePaymentLink: true,
  templateId: 'invoice_default',
};

export const usePaymentEmailStore = create<PaymentEmailState>()(
  devtools(
    (set, get) => ({
      paymentLinks: {},
      emailActivities: {},
      emailSendState: { ...defaultEmailSendState },
      
      setPaymentLink: (invoiceId, link) =>
        set(
          (state) => ({
            paymentLinks: link
              ? { ...state.paymentLinks, [invoiceId]: link }
              : Object.fromEntries(
                  Object.entries(state.paymentLinks).filter(([id]) => id !== invoiceId)
                ),
          }),
          false,
          'setPaymentLink'
        ),
      
      setEmailActivities: (invoiceId, activities) =>
        set(
          (state) => ({
            emailActivities: {
              ...state.emailActivities,
              [invoiceId]: activities,
            },
          }),
          false,
          'setEmailActivities'
        ),
      
      addEmailActivity: (invoiceId, activity) =>
        set(
          (state) => ({
            emailActivities: {
              ...state.emailActivities,
              [invoiceId]: [activity, ...(state.emailActivities[invoiceId] || [])],
            },
          }),
          false,
          'addEmailActivity'
        ),
      
      openEmailDialog: (invoiceId, recipientEmail, recipientName = '') =>
        set(
          (state) => ({
            emailSendState: {
              ...state.emailSendState,
              isOpen: true,
              invoiceId,
              recipientEmail,
              recipientName,
              subject: `Ihre Rechnung von Billux`, // Default subject
            },
          }),
          false,
          'openEmailDialog'
        ),
      
      closeEmailDialog: () =>
        set(
          (state) => ({
            emailSendState: {
              ...state.emailSendState,
              isOpen: false,
            },
          }),
          false,
          'closeEmailDialog'
        ),
      
      updateEmailState: (updates) =>
        set(
          (state) => ({
            emailSendState: {
              ...state.emailSendState,
              ...updates,
            },
          }),
          false,
          'updateEmailState'
        ),
      
      resetEmailState: () =>
        set(
          {
            emailSendState: { ...defaultEmailSendState },
          },
          false,
          'resetEmailState'
        ),
      
      generatePaymentLink: async (invoiceId) => {
        try {
          // Mock API call - replace with actual implementation
          const response = await fetch(`/api/invoices/${invoiceId}/payment-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (!response.ok) throw new Error('Failed to generate payment link');
          
          const link: PaymentLink = await response.json();
          
          get().setPaymentLink(invoiceId, link);
        } catch (error) {
          console.error('Failed to generate payment link:', error);
          throw error;
        }
      },
      
      revokePaymentLink: async (invoiceId) => {
        try {
          // Mock API call - replace with actual implementation
          const response = await fetch(`/api/invoices/${invoiceId}/payment-link`, {
            method: 'DELETE',
          });
          
          if (!response.ok) throw new Error('Failed to revoke payment link');
          
          get().setPaymentLink(invoiceId, null);
        } catch (error) {
          console.error('Failed to revoke payment link:', error);
          throw error;
        }
      },
    }),
    {
      name: 'payment-email-store',
      partialize: (state) => ({
        // Only persist payment links, not email state
        paymentLinks: state.paymentLinks,
      }),
    }
  )
);