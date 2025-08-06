import { z } from 'zod';

const customerSchema = z.object({
  company: z.string().min(1, 'Firma ist erforderlich'),
  contactPerson: z.string().optional(),
  taxId: z.string().min(1, 'Steuernummer ist erforderlich'),
  street: z.string().min(1, 'Straße ist erforderlich'),
  postalCode: z.string().min(1, 'PLZ ist erforderlich'),
  city: z.string().min(1, 'Stadt ist erforderlich'),
  email: z.string().email('Gültige E-Mail erforderlich'),
  phone: z.string().min(1, 'Telefonnummer ist erforderlich'),
});

export type Customer = {
  id: string;
  company: string;
  contactPerson?: string;
  taxId: string;
  address: string; // Combined address for backward compatibility
  street: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  projects?: string[]; // Array of project IDs
  totalRevenue: number;
  lastInvoiceDate?: string;
  createdAt?: string;
  updatedAt?: string;
  notes?: string;
  creditLimit?: number;
  paymentTerms?: string;
  outstandingBalance?: number;
  totalInvoices?: number;
  averageInvoiceValue?: number;
  onTimePaymentRate?: number;
  preferredPaymentMethod?: string;
  averagePaymentDelay?: number;
};

export type CreateCustomerDTO = z.infer<typeof customerSchema>;

export { customerSchema };
