import { Invoice, CreateInvoiceDTO, Payment, CreatePaymentDTO, InvoiceStatus } from '../types/invoice';
import type { Customer, CreateCustomerDTO } from '../types/customer';
import { Project, CreateProjectDTO } from '../types/project';
import { Article, CreateArticleDTO, UpdateArticleDTO } from '../types/article';
import { generateInvoicePreview } from '../services/pdfGeneration';
import type { PdfGenerationOptions, PdfPreviewData } from '../types/pdf';
import type { CompanySettings } from '../types/settings';
import { pdf } from '@react-pdf/renderer';
import { 
  Reminder, 
  ReminderLevel, 
  ReminderStatus, 
  ReminderStatistics,
  ReminderTemplate 
} from '../types/reminder';
import { 
  UploadedDocument, 
  ProcessingStatus, 
  OcrResult, 
  ParsedInvoiceData,
  ValidationError,
  ProcessingStep 
} from '../types/upload';
import { differenceInDays } from 'date-fns';

// Mock uploaded documents storage
const mockUploadedDocuments: UploadedDocument[] = [];

const mockCustomers: Customer[] = [
  {
    id: '1',
    company: 'Schmidt GmbH',
    contactPerson: 'Hans Schmidt',
    taxId: 'DE123456789',
    address: 'Hauptstraße 1, 10115 Berlin',
    street: 'Hauptstraße 1',
    postalCode: '10115',
    city: 'Berlin',
    email: 'kontakt@schmidt-gmbh.de',
    phone: '+49 30 12345678',
    projects: ['1'],
    totalRevenue: 245000,
    lastInvoiceDate: '2024-02-15',
  },
  {
    id: '2',
    company: 'Müller & Söhne',
    contactPerson: 'Klaus Müller',
    taxId: 'DE987654321',
    address: 'Industrieweg 15, 70565 Stuttgart',
    street: 'Industrieweg 15',
    postalCode: '70565',
    city: 'Stuttgart',
    email: 'info@mueller-soehne.de',
    phone: '+49 711 98765432',
    projects: [],
    totalRevenue: 78000,
    lastInvoiceDate: '2024-01-20',
  },
  {
    id: '3',
    company: 'Bau AG',
    contactPerson: 'Maria Bauer',
    taxId: 'DE456789123',
    address: 'Baustraße 8, 80331 München',
    street: 'Baustraße 8',
    postalCode: '80331',
    city: 'München',
    email: 'kontakt@bau-ag.de',
    phone: '+49 89 45678912',
    projects: [],
    totalRevenue: 567000,
    lastInvoiceDate: '2024-02-10',
  },
];

const mockInvoices = [
  {
    id: '1',
    number: 'RE-2024-001',
    date: '2024-02-15',
    customer: 'Schmidt GmbH',
    customerName: 'Schmidt GmbH',
    customerId: '1',
    amount: 12450.00,
    status: 'Bezahlt' as const,
    dueDate: '2024-03-15',
    paidAmount: 12450.00,
    payments: [],
    emailActivities: [],
    customerData: mockCustomers[0],
    type: 'Standard' as const
  },
  {
    id: '2',
    number: 'RE-2024-002',
    date: '2024-10-01',
    customer: 'Müller & Söhne',
    customerName: 'Müller & Söhne',
    customerId: '2',
    amount: 8900.00,
    status: 'Überfällig' as const,
    dueDate: '2024-10-31',
    paidAmount: 0,
    payments: [],
    emailActivities: [],
    customerData: mockCustomers[1],
    type: 'Standard' as const
  },
  {
    id: '3',
    number: 'RE-2024-003',
    date: '2024-09-15',
    customer: 'Bau AG',
    customerName: 'Bau AG',
    customerId: '3',
    amount: 15600.00,
    status: 'Überfällig' as const,
    dueDate: '2024-10-15',
    paidAmount: 0,
    payments: [],
    emailActivities: [],
    customerData: mockCustomers[2],
    type: 'Standard' as const,
    lastReminderLevel: ReminderLevel.FIRST_REMINDER,
    lastReminderDate: '2024-11-01',
    totalReminderFees: 5.00,
    reminderStatus: 'active' as const,
    reminderHistory: [{
      level: ReminderLevel.FIRST_REMINDER,
      sentDate: '2024-11-01',
      dueDate: '2024-11-15',
      fee: 5.00,
      status: 'sent'
    }]
  }
];

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Hausbau Projekt Nord',
    name: 'Hausbau Projekt Nord', // Alias for backward compatibility
    description: 'Neubau eines Einfamilienhauses',
    customerId: '1',
    customerName: 'Schmidt GmbH',
    status: 'in_progress',
    startDate: '2024-01-01',
    endDate: '2024-06-30',
    budget: 350000,
    totalValue: 350000,
    invoices: ['1'],
    invoicedValue: 50000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'Büro Renovierung',
    name: 'Büro Renovierung',
    description: 'Komplette Renovierung der Büroräume',
    customerId: '2',
    customerName: 'Weber & Partner KG',
    status: 'completed',
    startDate: '2024-02-15',
    endDate: '2024-04-30',
    budget: 125000,
    totalValue: 125000,
    invoices: ['2', '3'],
    invoicedValue: 125000,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-05-01T14:20:00Z'
  },
  {
    id: '3',
    title: 'Dachsanierung Altbau',
    name: 'Dachsanierung Altbau',
    description: 'Sanierung des Daches eines historischen Gebäudes',
    customerId: '3',
    customerName: 'Immobilien Schneider AG',
    status: 'planned',
    startDate: '2025-03-01',
    endDate: '2025-05-31',
    budget: 85000,
    totalValue: 85000,
    invoices: [],
    invoicedValue: 0,
    createdAt: '2024-12-15T00:00:00Z',
    updatedAt: '2024-12-15T00:00:00Z'
  },
  {
    id: '4',
    title: 'Badezimmer Modernisierung',
    name: 'Badezimmer Modernisierung',
    description: 'Modernisierung von 3 Badezimmern im Mehrfamilienhaus',
    customerId: '2',
    customerName: 'Weber & Partner KG',
    status: 'in_progress',
    startDate: '2025-01-15',
    endDate: '2025-02-28',
    budget: 45000,
    totalValue: 45000,
    invoices: [],
    invoicedValue: 0,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z'
  },
  {
    id: '5',
    title: 'Fassadenarbeiten',
    name: 'Fassadenarbeiten',
    description: 'Fassadensanierung und Neuanstrich',
    customerId: '1',
    customerName: 'Schmidt GmbH',
    status: 'cancelled',
    startDate: '2024-09-01',
    endDate: '2024-10-31',
    budget: 68000,
    totalValue: 68000,
    invoices: [],
    invoicedValue: 0,
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: '2024-08-20T16:45:00Z',
    notes: 'Projekt wurde vom Kunden storniert'
  }
];

const mockArticles: Article[] = [
  {
    id: '1',
    name: 'Malerarbeiten Standard',
    description: 'Standardmäßige Malerarbeiten inkl. Vorbereitung',
    unit: 'm²',
    basePrice: 35.00,
    category: 'Malerarbeiten',
    isActive: true,
    stock: 0,
    minStock: 0,
    taxRate: 19,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Tapezierarbeiten Premium',
    description: 'Hochwertige Tapezierarbeiten mit Mustertapeten',
    unit: 'm²',
    basePrice: 45.00,
    category: 'Tapezierarbeiten',
    isActive: true,
    stock: 0,
    minStock: 0,
    taxRate: 19,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-20T14:15:00Z'
  },
  {
    id: '3',
    name: 'Fußbodenverlegung',
    description: 'Professionelle Verlegung von Fußböden',
    unit: 'm²',
    basePrice: 55.00,
    category: 'Bodenarbeiten',
    isActive: true,
    stock: 0,
    minStock: 0,
    taxRate: 19,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-01T09:00:00Z'
  },
  {
    id: '4',
    name: 'Beratungsstunde',
    description: 'Fachberatung und Projektplanung',
    unit: 'Stunde',
    basePrice: 85.00,
    category: 'Beratung',
    isActive: true,
    stock: 0,
    minStock: 0,
    taxRate: 19,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-03-10T11:20:00Z'
  },
  {
    id: '5',
    name: 'Spachtelmasse Premium',
    description: 'Hochwertige Spachtelmasse für glatte Oberflächen',
    unit: 'kg',
    basePrice: 12.50,
    category: 'Material',
    isActive: true,
    stock: 150,
    minStock: 20,
    taxRate: 19,
    notes: 'Lagerware - Mindestbestand beachten',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-03-18T16:00:00Z'
  }
];

const mockSettings: CompanySettings = {
  name: 'Muster GmbH',
  address: 'Musterstraße 123, 12345 Musterstadt',
  phone: '+49 123 456789',
  email: 'info@muster-gmbh.de',
  website: 'www.muster-gmbh.de',
  vatId: 'DE123456789',
  taxId: '12/345/67890',
  bankDetails: {
    accountHolder: 'Muster GmbH',
    iban: 'DE12 3456 7890 1234 5678 90',
    bic: 'ABCDEFGHIJK',
    bankName: 'Musterbank'
  },
  logo: undefined,
  invoiceSettings: {
    numberPrefix: 'RE-',
    nextNumber: 2024004,
    defaultDueDays: 30,
    defaultTaxRate: 19,
    defaultPaymentTerms: 'Zahlbar innerhalb von 30 Tagen nach Rechnungsdatum ohne Abzug.'
  },
  paymentSettings: {
    enableOnlinePayments: false,
    acceptedPaymentMethods: ['card', 'sepa']
  },
  emailSettings: {
    enableEmailSending: true,
    provider: 'smtp',
    fromEmail: 'rechnung@muster-gmbh.de',
    fromName: 'Muster GmbH',
    emailTemplates: {
      invoiceSubject: 'Ihre Rechnung {invoiceNumber}',
      invoiceBody: 'Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie Ihre Rechnung.\n\nMit freundlichen Grüßen',
      paymentReminderSubject: 'Zahlungserinnerung - Rechnung {invoiceNumber}',
      paymentReminderBody: 'Sehr geehrte Damen und Herren,\n\nwir möchten Sie freundlich an die noch offene Rechnung erinnern.\n\nMit freundlichen Grüßen'
    }
  },
  reminderSettings: {
    enabled: true,
    automaticSending: false,
    reminderSchedule: {
      friendly: 7,
      firstReminder: 14,
      secondReminder: 21,
      finalNotice: 30
    },
    reminderFees: {
      firstReminder: 5.00,
      secondReminder: 10.00,
      finalNotice: 15.00
    },
    interest: {
      enabled: true,
      rate: 8.17, // Base rate + 5%
      basePlusRate: 5
    },
    templates: {
      [ReminderLevel.FRIENDLY]: {
        subject: 'Zahlungserinnerung - Rechnung {invoiceNumber}',
        body: `Sehr geehrte/r {customerName},

wir möchten Sie freundlich daran erinnern, dass die Zahlung für Rechnung {invoiceNumber} vom {invoiceDate} in Höhe von {amount} EUR noch aussteht.

Die Rechnung ist seit {daysOverdue} Tagen überfällig.

Bitte überweisen Sie den Betrag bis zum {dueDate} auf unser Konto:
{companyName}
IBAN: {companyIban}
BIC: {companyBic}

Mit freundlichen Grüßen
{companyName}`,
        attachOriginalInvoice: true,
        includeLegalText: false
      },
      [ReminderLevel.FIRST_REMINDER]: {
        subject: '1. Mahnung - Rechnung {invoiceNumber}',
        body: `Sehr geehrte/r {customerName},

leider konnten wir bis heute keinen Zahlungseingang für unsere Rechnung {invoiceNumber} vom {invoiceDate} feststellen.

Offener Betrag: {amount} EUR
Mahngebühr: {reminderFee} EUR
Gesamtbetrag: {totalAmount} EUR

Die Rechnung ist bereits seit {daysOverdue} Tagen überfällig.

Bitte überweisen Sie den Gesamtbetrag unverzüglich, spätestens bis zum {dueDate}, auf unser Konto:
{companyName}
IBAN: {companyIban}
BIC: {companyBic}

Mit freundlichen Grüßen
{companyName}`,
        attachOriginalInvoice: true,
        includeLegalText: true
      },
      [ReminderLevel.SECOND_REMINDER]: {
        subject: '2. Mahnung - Rechnung {invoiceNumber}',
        body: `Sehr geehrte/r {customerName},

trotz unserer Zahlungserinnerung vom {lastReminderDate} ist die Rechnung {invoiceNumber} vom {invoiceDate} noch immer unbeglichen.

Offener Betrag: {amount} EUR
Mahngebühr (1. Mahnung): {previousReminderFee} EUR
Mahngebühr (2. Mahnung): {reminderFee} EUR
Verzugszinsen: {interestAmount} EUR
Gesamtbetrag: {totalAmount} EUR

Die Rechnung ist seit {daysOverdue} Tagen überfällig.

Wir fordern Sie hiermit letztmalig auf, den Gesamtbetrag bis zum {dueDate} zu begleichen.

Zahlungsempfänger: {companyName}
IBAN: {companyIban}
BIC: {companyBic}

Mit freundlichen Grüßen
{companyName}`,
        attachOriginalInvoice: true,
        includeLegalText: true
      },
      [ReminderLevel.FINAL_NOTICE]: {
        subject: 'Letzte Mahnung vor rechtlichen Schritten - Rechnung {invoiceNumber}',
        body: `Sehr geehrte/r {customerName},

trotz mehrfacher Mahnungen ist unsere Rechnung {invoiceNumber} vom {invoiceDate} weiterhin unbeglichen.

Offener Betrag: {amount} EUR
Mahngebühren gesamt: {totalReminderFees} EUR
Verzugszinsen: {interestAmount} EUR
GESAMTFORDERUNG: {totalAmount} EUR

Die Rechnung ist seit {daysOverdue} Tagen überfällig.

LETZTE ZAHLUNGSFRIST: {dueDate}

Sollte bis zu diesem Datum keine Zahlung eingehen, werden wir ohne weitere Ankündigung rechtliche Schritte einleiten. Dies kann zu erheblichen zusätzlichen Kosten für Sie führen.

Vermeiden Sie weitere Kosten und überweisen Sie den Betrag umgehend:
{companyName}
IBAN: {companyIban}
BIC: {companyBic}

Mit freundlichen Grüßen
{companyName}`,
        attachOriginalInvoice: true,
        includeLegalText: true
      },
      [ReminderLevel.LEGAL_ACTION]: {
        subject: 'Übergabe an Inkasso - Rechnung {invoiceNumber}',
        body: `Sehr geehrte/r {customerName},

da Sie trotz mehrfacher Mahnungen unsere Rechnung {invoiceNumber} vom {invoiceDate} nicht beglichen haben, sehen wir uns gezwungen, die Forderung an unser Inkassobüro zu übergeben.

Offene Hauptforderung: {amount} EUR
Mahngebühren: {totalReminderFees} EUR
Verzugszinsen: {interestAmount} EUR
GESAMTFORDERUNG: {totalAmount} EUR

Ab sofort ist ausschließlich unser Inkassobüro für diese Angelegenheit zuständig. Weitere Kosten werden Ihnen in Rechnung gestellt.

Diese Mitteilung dient zu Ihrer Information.

{companyName}`,
        attachOriginalInvoice: false,
        includeLegalText: true
      }
    }
  }
};

const mockReminders: Reminder[] = [];

export const api = {
  invoices: {
    getAll: async () => {
      return Promise.resolve(mockInvoices);
    },
    get: async (id: string) => {
      return Promise.resolve(mockInvoices.find(inv => inv.id === id));
    },
    getByCustomer: async (customerName: string): Promise<Invoice[]> => {
      return Promise.resolve(mockInvoices.filter(inv => inv.customer === customerName));
    },
    getByProject: async (projectId: string): Promise<Invoice[]> => {
      return Promise.resolve(mockInvoices.filter(inv => inv.projectId === projectId));
    },
    create: async (data: CreateInvoiceDTO) => {
      console.log('API: Creating invoice with data:', data);
      const newInvoice = {
        id: `invoice-${Date.now()}`,
        ...data,
        status: 'Offen' as const,
        amount: data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
        paidAmount: 0,
        payments: []
      };
      console.log('API: Created new invoice:', newInvoice);
      mockInvoices.push(newInvoice);
      console.log('API: Current mockInvoices length:', mockInvoices.length);
      return Promise.resolve(newInvoice);
    },
    addPayment: async (invoiceId: string, paymentData: CreatePaymentDTO): Promise<Payment> => {
      const invoice = mockInvoices.find(inv => inv.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      
      const payment: Payment = {
        id: `payment-${Date.now()}`,
        ...paymentData,
      };
      
      if (!Array.isArray(invoice.payments)) {
        invoice.payments = [];
      }
      
      invoice.payments.push(payment);
      invoice.paidAmount += payment.amount;
      
      // Update invoice status based on paid amount
      const newStatus: InvoiceStatus = invoice.paidAmount >= invoice.amount 
        ? 'Bezahlt' 
        : invoice.paidAmount > 0 
          ? 'Teilweise bezahlt'
          : new Date(invoice.dueDate) < new Date()
            ? 'Überfällig'
            : 'Offen';
            
      invoice.status = newStatus;
      
      return Promise.resolve(payment);
    },
    getPayments: async (invoiceId: string): Promise<Payment[]> => {
      const invoice = mockInvoices.find(inv => inv.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      return Promise.resolve(invoice.payments);
    },
    delete: async (id: string): Promise<void> => {
      const index = mockInvoices.findIndex(inv => inv.id === id);
      if (index === -1) throw new Error('Invoice not found');
      mockInvoices.splice(index, 1);
      return Promise.resolve();
    },
    update: async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
      const index = mockInvoices.findIndex(inv => inv.id === id);
      if (index === -1) throw new Error('Invoice not found');
      
      mockInvoices[index] = {
        ...mockInvoices[index],
        ...data,
      };
      
      return Promise.resolve(mockInvoices[index]);
    },
  },
  customers: {
    getAll: async (): Promise<Customer[]> => {
      return Promise.resolve(mockCustomers);
    },
    getById: async (id: string): Promise<Customer | undefined> => {
      const customer = mockCustomers.find(c => c.id === id);
      if (customer) {
        // Calculate additional financial metrics
        const customerInvoices = mockInvoices.filter(inv => inv.customer === customer.company);
        const totalInvoices = customerInvoices.length;
        const paidInvoices = customerInvoices.filter(inv => inv.status === 'Bezahlt');
        const totalInvoiceAmount = customerInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const totalPaidAmount = customerInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        
        return Promise.resolve({
          ...customer,
          outstandingBalance: totalInvoiceAmount - totalPaidAmount,
          totalInvoices,
          averageInvoiceValue: totalInvoices > 0 ? totalInvoiceAmount / totalInvoices : 0,
          onTimePaymentRate: totalInvoices > 0 ? (paidInvoices.length / totalInvoices) * 100 : 0,
          createdAt: customer.createdAt || '2024-01-01T00:00:00Z',
          updatedAt: customer.updatedAt || new Date().toISOString()
        });
      }
      return Promise.resolve(undefined);
    },
    create: async (data: CreateCustomerDTO): Promise<Customer> => {
      const newCustomer: Customer = {
        id: `customer-${Date.now()}`,
        ...data,
        address: `${data.street}, ${data.postalCode} ${data.city}`, // Combined address
        projects: [],
        totalRevenue: 0,
        lastInvoiceDate: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockCustomers.push(newCustomer);
      return Promise.resolve(newCustomer);
    },
    update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
      const index = mockCustomers.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Customer not found');
      
      mockCustomers[index] = {
        ...mockCustomers[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      return Promise.resolve(mockCustomers[index]);
    },
    delete: async (id: string): Promise<void> => {
      const index = mockCustomers.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Customer not found');
      mockCustomers.splice(index, 1);
      return Promise.resolve();
    }
  },
  projects: {
    getAll: async (): Promise<Project[]> => {
      return Promise.resolve(mockProjects);
    },
    get: async (id: string): Promise<Project | undefined> => {
      const project = mockProjects.find(p => p.id === id);
      if (project) {
        // Calculate additional fields
        const customer = mockCustomers.find(c => c.id === project.customerId);
        const projectInvoices = mockInvoices.filter(inv => inv.projectId === project.id);
        
        const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const totalPaid = projectInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
        const remainingValue = project.budget - totalInvoiced;
        
        // Calculate progress and timeline
        const today = new Date();
        const startDate = new Date(project.startDate);
        const endDate = new Date(project.endDate);
        const totalDays = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysPassed = Math.max(0, (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const progressPercentage = project.status === 'completed' ? 100 : 
                                   project.status === 'cancelled' ? 0 :
                                   Math.min(100, Math.round((daysPassed / totalDays) * 100));
        
        return Promise.resolve({
          ...project,
          name: project.title, // Alias for backward compatibility
          customerName: customer?.company,
          totalValue: project.budget,
          invoicedValue: totalInvoiced,
          totalInvoiced,
          totalPaid,
          outstandingBalance: totalInvoiced - totalPaid,
          remainingValue,
          progressPercentage,
          daysRemaining: Math.round(daysRemaining),
          isOverdue: today > endDate && project.status === 'in_progress',
          createdAt: project.createdAt || '2024-01-01T00:00:00Z',
          updatedAt: project.updatedAt || new Date().toISOString()
        });
      }
      return Promise.resolve(undefined);
    },
    getByCustomer: async (customerId: string): Promise<Project[]> => {
      return Promise.resolve(mockProjects.filter(p => p.customerId === customerId));
    },
    create: async (data: CreateProjectDTO): Promise<Project> => {
      const newProject: Project = {
        id: `project-${Date.now()}`,
        ...data,
        name: data.title,
        totalValue: data.budget,
        status: 'planned',
        invoices: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockProjects.push(newProject);
      return Promise.resolve(newProject);
    },
    update: async (id: string, data: Partial<Project>): Promise<Project> => {
      const index = mockProjects.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Project not found');
      
      mockProjects[index] = {
        ...mockProjects[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      // Update aliases if main fields are updated
      if (data.title) {
        mockProjects[index].name = data.title;
      }
      if (data.budget !== undefined) {
        mockProjects[index].totalValue = data.budget;
      }
      
      return Promise.resolve(mockProjects[index]);
    },
    delete: async (id: string): Promise<void> => {
      const index = mockProjects.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Project not found');
      mockProjects.splice(index, 1);
      return Promise.resolve();
    }
  },
  articles: {
    getAll: async (): Promise<Article[]> => {
      return Promise.resolve([...mockArticles]);
    },

    get: async (id: string): Promise<Article | undefined> => {
      const article = mockArticles.find(a => a.id === id);
      if (article) {
        // Calculate usage statistics from invoices
        let usageCount = 0;
        let totalRevenue = 0;
        let totalQuantity = 0;
        let lastUsedDate: string | undefined;
        
        // Search through all invoices for this article
        mockInvoices.forEach(invoice => {
          // Note: In a real implementation, invoice items would contain articleId
          // For now, we'll simulate this by checking if the invoice contains this article
          // This is a simplified implementation
          const hasArticle = Math.random() > 0.7; // Simulate 30% of invoices have this article
          if (hasArticle) {
            usageCount++;
            const quantity = Math.floor(Math.random() * 10) + 1;
            totalQuantity += quantity;
            totalRevenue += article.basePrice * quantity;
            if (!lastUsedDate || invoice.date > lastUsedDate) {
              lastUsedDate = invoice.date;
            }
          }
        });
        
        return Promise.resolve({
          ...article,
          isActive: article.isActive !== false,
          stock: article.stock || Math.floor(Math.random() * 100),
          minStock: article.minStock || 10,
          taxRate: article.taxRate || 19,
          createdAt: article.createdAt || '2024-01-01T00:00:00Z',
          updatedAt: article.updatedAt || new Date().toISOString(),
          usageCount,
          totalRevenue,
          lastUsedDate,
          averageQuantity: usageCount > 0 ? totalQuantity / usageCount : 0,
          stockValue: (article.stock || 0) * article.basePrice
        });
      }
      return Promise.resolve(undefined);
    },

    create: async (data: CreateArticleDTO): Promise<Article> => {
      const newArticle = {
        ...data,
        id: Math.random().toString(36).slice(2),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockArticles.push(newArticle);
      return Promise.resolve(newArticle);
    },

    update: async (id: string, data: UpdateArticleDTO): Promise<Article> => {
      const index = mockArticles.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Article not found');
      
      const updatedArticle = { 
        ...mockArticles[index], 
        ...data,
        updatedAt: new Date().toISOString()
      };
      mockArticles[index] = updatedArticle;
      return Promise.resolve(updatedArticle);
    },

    delete: async (id: string): Promise<void> => {
      const index = mockArticles.findIndex(a => a.id === id);
      if (index !== -1) {
        mockArticles.splice(index, 1);
      }
      return Promise.resolve();
    }
  },
  settings: {
    get: async (): Promise<CompanySettings> => {
      return Promise.resolve(mockSettings);
    },
    update: async (data: Partial<CompanySettings>): Promise<CompanySettings> => {
      Object.assign(mockSettings, data);
      return Promise.resolve(mockSettings);
    }
  },
  pdf: {
    preview: async (options: PdfGenerationOptions): Promise<PdfPreviewData> => {
      console.log('API: Generating PDF preview for document ID:', options.documentId);
      const invoice = await api.invoices.get(options.documentId);
      if (!invoice) throw new Error('Invoice not found');
      
      const settings = await api.settings.get();
      
      // Generate the React PDF component
      const InvoiceDocument = generateInvoicePreview(invoice, settings);
      
      // Create a blob URL from the PDF
      const blob = await pdf(InvoiceDocument()).toBlob();
      const url = URL.createObjectURL(blob);
      
      console.log('PDF preview generated successfully');
      
      return {
        component: InvoiceDocument,
        url: url,
        expiresAt: Date.now() + 3600000 // 1 hour from now
      };
    },

    download: async (options: PdfGenerationOptions): Promise<Uint8Array | Blob> => {
      console.log('API: Generating PDF download for document ID:', options.documentId);
      const invoice = await api.invoices.get(options.documentId);
      if (!invoice) throw new Error('Invoice not found');
      
      const settings = await api.settings.get();

      try {
        // Generate the PDF blob instead of a stream
        const InvoiceDocument = generateInvoicePreview(invoice, settings);
        const blob = await pdf(InvoiceDocument).toBlob();
        
        console.log('PDF download generated successfully');
        return blob;
      } catch (error) {
        console.error('PDF generation error:', error);
        throw error;
      }
    }
  },
  payments: {
    getAll: async (): Promise<Payment[]> => {
      const allPayments: Payment[] = [];
      
      mockInvoices.forEach(invoice => {
        if (invoice.payments && invoice.payments.length > 0) {
          allPayments.push(...invoice.payments);
        }
      });
      
      // Sort by date descending
      allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return Promise.resolve(allPayments);
    },
    getByCustomer: async (customerName: string): Promise<Payment[]> => {
      const customerInvoices = mockInvoices.filter(inv => inv.customer === customerName);
      const allPayments: Payment[] = [];
      
      customerInvoices.forEach(invoice => {
        if (invoice.payments && invoice.payments.length > 0) {
          allPayments.push(...invoice.payments);
        }
      });
      
      // Sort by date descending
      allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return Promise.resolve(allPayments);
    }
  },
  reminders: {
    getOverdueInvoices: async (): Promise<Invoice[]> => {
      const today = new Date();
      return Promise.resolve(
        mockInvoices.filter(invoice => {
          if (invoice.status === 'Bezahlt' || invoice.status === 'Entwurf') return false;
          const dueDate = new Date(invoice.dueDate);
          return dueDate < today;
        })
      );
    },

    getByInvoice: async (invoiceId: string): Promise<Reminder[]> => {
      return Promise.resolve(
        mockReminders.filter(reminder => reminder.invoiceId === invoiceId)
      );
    },

    getAll: async (): Promise<Reminder[]> => {
      return Promise.resolve([...mockReminders]);
    },

    create: async (invoiceId: string, level: ReminderLevel): Promise<Reminder> => {
      const invoice = mockInvoices.find(inv => inv.id === invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      
      const customer = mockCustomers.find(c => c.company === invoice.customer);
      if (!customer) throw new Error('Customer not found');
      
      const settings = mockSettings.reminderSettings;
      if (!settings) throw new Error('Reminder settings not configured');
      
      // Calculate fees
      let reminderFee = 0;
      if (level >= ReminderLevel.FIRST_REMINDER) {
        reminderFee = level === ReminderLevel.FIRST_REMINDER ? settings.reminderFees.firstReminder :
                      level === ReminderLevel.SECOND_REMINDER ? settings.reminderFees.secondReminder :
                      settings.reminderFees.finalNotice;
      }
      
      // Calculate interest if enabled
      let interestAmount = 0;
      if (settings.interest.enabled && level >= ReminderLevel.SECOND_REMINDER) {
        const daysOverdue = differenceInDays(new Date(), new Date(invoice.dueDate));
        interestAmount = (invoice.amount * settings.interest.rate / 100 / 365) * daysOverdue;
      }
      
      const reminder: Reminder = {
        id: `reminder-${Date.now()}`,
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        customerId: customer.id,
        customerName: customer.company,
        level,
        status: ReminderStatus.PENDING,
        sentDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        originalAmount: invoice.amount,
        reminderFee,
        interestAmount,
        totalAmount: invoice.amount + reminderFee + interestAmount,
        template: '',
        emailSubject: `Mahnung - Rechnung ${invoice.number}`,
        emailBody: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      mockReminders.push(reminder);
      
      // Update invoice reminder fields
      if (!invoice.reminderHistory) invoice.reminderHistory = [];
      invoice.reminderHistory.push({
        level,
        sentDate: reminder.sentDate,
        dueDate: reminder.dueDate,
        fee: reminderFee,
        status: 'sent'
      });
      invoice.lastReminderLevel = level;
      invoice.lastReminderDate = reminder.sentDate;
      invoice.totalReminderFees = (invoice.totalReminderFees || 0) + reminderFee;
      invoice.reminderStatus = 'active';
      
      return Promise.resolve(reminder);
    },

    send: async (reminderId: string): Promise<Reminder> => {
      const reminder = mockReminders.find(r => r.id === reminderId);
      if (!reminder) throw new Error('Reminder not found');
      
      reminder.status = ReminderStatus.SENT;
      reminder.updatedAt = new Date().toISOString();
      
      return Promise.resolve(reminder);
    },

    updateStatus: async (reminderId: string, status: ReminderStatus): Promise<Reminder> => {
      const reminder = mockReminders.find(r => r.id === reminderId);
      if (!reminder) throw new Error('Reminder not found');
      
      reminder.status = status;
      reminder.updatedAt = new Date().toISOString();
      
      // Update invoice if paid
      if (status === ReminderStatus.PAID) {
        const invoice = mockInvoices.find(inv => inv.id === reminder.invoiceId);
        if (invoice) {
          invoice.reminderStatus = 'resolved';
        }
      }
      
      return Promise.resolve(reminder);
    },

    getStatistics: async (): Promise<ReminderStatistics> => {
      const overdueInvoices = await api.reminders.getOverdueInvoices();
      
      const byLevel = [
        ReminderLevel.FRIENDLY,
        ReminderLevel.FIRST_REMINDER,
        ReminderLevel.SECOND_REMINDER,
        ReminderLevel.FINAL_NOTICE
      ].map(level => {
        const remindersAtLevel = mockReminders.filter(r => r.level === level);
        return {
          level,
          count: remindersAtLevel.length,
          amount: remindersAtLevel.reduce((sum, r) => sum + r.totalAmount, 0)
        };
      });
      
      const today = new Date();
      const byAge = [
        { range: '0-30', min: 0, max: 30 },
        { range: '31-60', min: 31, max: 60 },
        { range: '61-90', min: 61, max: 90 },
        { range: '90+', min: 91, max: Infinity }
      ].map(({ range, min, max }) => {
        const invoicesInRange = overdueInvoices.filter(invoice => {
          const daysOverdue = differenceInDays(today, new Date(invoice.dueDate));
          return daysOverdue >= min && daysOverdue <= max;
        });
        return {
          range,
          count: invoicesInRange.length,
          amount: invoicesInRange.reduce((sum, inv) => sum + inv.amount, 0)
        };
      });
      
      const totalDaysOverdue = overdueInvoices.reduce((sum, invoice) => {
        return sum + differenceInDays(today, new Date(invoice.dueDate));
      }, 0);
      
      const averageDaysOverdue = overdueInvoices.length > 0 ? 
        totalDaysOverdue / overdueInvoices.length : 0;
      
      const totalOverdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const paidReminders = mockReminders.filter(r => r.status === ReminderStatus.PAID);
      const collectionRate = mockReminders.length > 0 ?
        (paidReminders.length / mockReminders.length) * 100 : 0;
      
      return Promise.resolve({
        totalOverdue: overdueInvoices.length,
        totalAmount: totalOverdueAmount,
        byLevel,
        byAge,
        averageDaysOverdue,
        collectionRate
      });
    },

    getTemplates: async (): Promise<ReminderTemplate[]> => {
      // Default German reminder templates
      return Promise.resolve([
        {
          level: ReminderLevel.FRIENDLY,
          name: 'Zahlungserinnerung',
          subject: 'Zahlungserinnerung - Rechnung {invoiceNumber}',
          body: `Sehr geehrte Damen und Herren,

wir möchten Sie freundlich daran erinnern, dass die Zahlung für Rechnung {invoiceNumber} vom {invoiceDate} in Höhe von {amount} EUR noch aussteht.

Bitte überweisen Sie den Betrag bis zum {dueDate} auf unser Konto.

Mit freundlichen Grüßen`,
          variables: ['invoiceNumber', 'invoiceDate', 'amount', 'dueDate'],
          isDefault: true
        },
        {
          level: ReminderLevel.FIRST_REMINDER,
          name: '1. Mahnung',
          subject: '1. Mahnung - Rechnung {invoiceNumber}',
          body: `Sehr geehrte Damen und Herren,

leider konnten wir bis heute keinen Zahlungseingang für unsere Rechnung {invoiceNumber} vom {invoiceDate} feststellen.

Offener Betrag: {amount} EUR
Mahngebühr: {reminderFee} EUR
Gesamtbetrag: {totalAmount} EUR

Bitte überweisen Sie den Gesamtbetrag bis zum {dueDate}.

Mit freundlichen Grüßen`,
          variables: ['invoiceNumber', 'invoiceDate', 'amount', 'reminderFee', 'totalAmount', 'dueDate'],
          legalText: 'Sollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie diese Mahnung als gegenstandslos.',
          isDefault: true
        }
      ]);
    }
  },

  // Upload and OCR processing endpoints
  upload: {
    // Upload a file and start processing
    uploadFile: async (file: File): Promise<UploadedDocument> => {
      const uploadedDocument: UploadedDocument = {
        id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        status: 'uploading',
        processingProgress: 0
      };

      mockUploadedDocuments.push(uploadedDocument);
      
      // Simulate async processing
      setTimeout(async () => {
        await api.upload.processDocument(uploadedDocument.id);
      }, 1000);

      return Promise.resolve(uploadedDocument);
    },

    // Get all uploaded documents
    getDocuments: async (): Promise<UploadedDocument[]> => {
      return Promise.resolve([...mockUploadedDocuments]);
    },

    // Get specific document
    getDocument: async (documentId: string): Promise<UploadedDocument> => {
      const document = mockUploadedDocuments.find(doc => doc.id === documentId);
      if (!document) throw new Error('Document not found');
      return Promise.resolve(document);
    },

    // Process a document (OCR and parsing)
    processDocument: async (documentId: string): Promise<UploadedDocument> => {
      const document = mockUploadedDocuments.find(doc => doc.id === documentId);
      if (!document) throw new Error('Document not found');

      // Simulate processing stages
      const stages: ProcessingStep[] = [
        { name: 'OCR-Verarbeitung', status: 'pending' },
        { name: 'Datenextraktion', status: 'pending' },
        { name: 'Lieferantenabgleich', status: 'pending' },
        { name: 'Validierung', status: 'pending' },
        { name: 'Fertigstellung', status: 'pending' }
      ];

      document.processingSteps = stages;
      document.status = 'processing';

      // Simulate each processing stage
      for (let i = 0; i < stages.length; i++) {
        const step = stages[i];
        const startTime = Date.now();
        
        step.status = 'running';
        step.startTime = new Date();
        
        // Simulate processing time
        const processingTime = Math.random() * 2000 + 1000; // 1-3 seconds
        await new Promise(resolve => setTimeout(resolve, processingTime));
        
        step.status = 'completed';
        step.endTime = new Date();
        step.duration = Date.now() - startTime;
        
        document.processingProgress = Math.round(((i + 1) / stages.length) * 100);
      }

      // Add mock OCR result
      document.ocrResult = {
        text: `MUSTERFIRMA GMBH
Musterstraße 1
12345 Berlin
Tel: +49 30 12345678
Email: info@musterfirma.de
USt-IdNr: DE123456789

RECHNUNG

Rechnungsnummer: RE-2024-001
Rechnungsdatum: 15.01.2024
Lieferdatum: 10.01.2024
Fälligkeitsdatum: 14.02.2024

Kunde:
Max Mustermann GmbH
Kundenstraße 2
54321 Hamburg

Pos | Beschreibung | Menge | Einzelpreis | Gesamtpreis
1   | Beratungsleistung | 8 Std | 125,00 € | 1.000,00 €

Nettobetrag: 1.000,00 €
MwSt. 19%: 190,00 €
Rechnungsbetrag: 1.190,00 €

Zahlbar innerhalb 30 Tagen ohne Abzug.`,
        confidence: 0.92,
        processingTime: 3500,
        pageCount: 1,
        metadata: {
          fileSize: document.fileSize,
          format: document.mimeType,
          language: 'de'
        }
      };

      // Add mock parsed data
      document.parsedData = {
        invoiceNumber: 'RE-2024-001',
        date: '2024-01-15',
        dueDate: '2024-02-14',
        vendor: {
          name: 'Musterfirma GmbH',
          address: 'Musterstraße 1, 12345 Berlin',
          taxId: 'DE123456789'
        },
        customer: {
          name: 'Max Mustermann GmbH',
          address: 'Kundenstraße 2, 54321 Hamburg'
        },
        items: [
          {
            description: 'Beratungsleistung',
            quantity: 8,
            unitPrice: 125.00,
            taxRate: 19,
            total: 1000.00
          }
        ],
        totals: {
          subtotal: 1000.00,
          taxAmount: 190.00,
          total: 1190.00
        },
        confidence: 0.88
      };

      // Perform vendor matching
      try {
        const { VendorMatchingService } = await import('../services/vendorMatchingService');
        const customers = await api.customers.getAll();
        const vendorMatcher = new VendorMatchingService(customers);
        
        // Find all potential matches
        const allMatches = vendorMatcher.findAllMatches(document.parsedData.vendor);
        
        // Convert to our upload-specific format
        document.vendorMatches = allMatches.map(match => ({
          customer: {
            id: match.customer.id,
            company: match.customer.company,
            address: match.customer.address,
            taxId: match.customer.taxId
          },
          confidence: match.confidence,
          matchType: match.matchType,
          matchedFields: match.matchedFields
        }));
        
        // Get customer creation suggestion
        const suggestion = vendorMatcher.shouldCreateNewCustomer(document.parsedData.vendor);
        document.suggestedCustomer = {
          shouldCreate: suggestion.shouldCreate,
          reason: suggestion.reason,
          suggestedData: {
            company: suggestion.suggestedData.company || '',
            contactPerson: suggestion.suggestedData.contactPerson || '',
            taxId: suggestion.suggestedData.taxId,
            address: suggestion.suggestedData.address || '',
            street: suggestion.suggestedData.street || '',
            postalCode: suggestion.suggestedData.postalCode || '',
            city: suggestion.suggestedData.city || '',
            email: suggestion.suggestedData.email || '',
            phone: suggestion.suggestedData.phone || ''
          }
        };
      } catch (error) {
        console.warn('Vendor matching failed:', error);
        document.vendorMatches = [];
        document.suggestedCustomer = {
          shouldCreate: true,
          reason: 'Automatischer Abgleich fehlgeschlagen',
          suggestedData: {
            company: document.parsedData.vendor.name,
            contactPerson: '',
            taxId: document.parsedData.vendor.taxId,
            address: document.parsedData.vendor.address,
            street: '',
            postalCode: '',
            city: '',
            email: '',
            phone: ''
          }
        };
      }

      // Enhanced validation with specific error handling
      try {
        const { errorHandlingService } = await import('../services/errorHandlingService');
        
        // Reset validation errors
        document.validationErrors = [];
        
        // Analyze each field with enhanced error detection
        const fieldsToAnalyze = [
          { field: 'invoiceNumber', value: document.parsedData.invoiceNumber },
          { field: 'date', value: document.parsedData.date },
          { field: 'dueDate', value: document.parsedData.dueDate },
          { field: 'vendor.name', value: document.parsedData.vendor.name },
          { field: 'vendor.taxId', value: document.parsedData.vendor.taxId },
          { field: 'vendor.address', value: document.parsedData.vendor.address },
          { field: 'totals.total', value: document.parsedData.totals.total?.toString() || '' },
          { field: 'totals.subtotal', value: document.parsedData.totals.subtotal?.toString() || '' },
          { field: 'totals.taxAmount', value: document.parsedData.totals.taxAmount?.toString() || '' }
        ];

        for (const { field, value } of fieldsToAnalyze) {
          const enhancedErrors = errorHandlingService.analyzeField(field, value, document.parsedData);
          
          // Convert enhanced errors to regular validation errors for compatibility
          const regularErrors = enhancedErrors.map(error => ({
            field: error.field,
            message: error.message,
            severity: error.severity,
            suggestion: error.correctionSuggestions?.[0]?.description || error.suggestion,
            // Store enhanced data in a way that can be accessed by UI
            enhancedData: {
              context: error.context,
              possibleCauses: error.possibleCauses,
              correctionSuggestions: error.correctionSuggestions,
              autoFixAvailable: error.autoFixAvailable,
              learnFromUser: error.learnFromUser,
              relatedFields: error.relatedFields
            }
          }));
          
          document.validationErrors.push(...regularErrors);
        }
        
        // Add some business logic validation
        if (document.parsedData.totals.total > 10000) {
          document.validationErrors.push({
            field: 'total',
            message: 'Sehr hoher Rechnungsbetrag',
            severity: 'warning',
            suggestion: 'Bitte überprüfen Sie den Betrag',
            enhancedData: {
              context: 'Ungewöhnlich hoher Betrag erkannt',
              possibleCauses: ['OCR-Fehler möglich', 'Tatsächlich hoher Betrag'],
              correctionSuggestions: [{
                type: 'manual',
                description: 'Betrag manuell überprüfen',
                confidence: 0.8,
                requiresUserInput: true,
                inputType: 'number'
              }],
              autoFixAvailable: false,
              learnFromUser: true
            }
          });
        }
        
      } catch (error) {
        console.warn('Enhanced validation failed, using basic validation:', error);
        document.validationErrors = [];
        
        // Fallback to basic validation
        if (document.parsedData.totals.total > 10000) {
          document.validationErrors.push({
            field: 'total',
            message: 'Betrag ungewöhnlich hoch',
            severity: 'warning',
            suggestion: 'Bitte überprüfen Sie den Gesamtbetrag'
          });
        }
      }

      document.status = 'completed';
      return Promise.resolve(document);
    },

    // Delete a document
    deleteDocument: async (documentId: string): Promise<void> => {
      const index = mockUploadedDocuments.findIndex(doc => doc.id === documentId);
      if (index === -1) throw new Error('Document not found');
      
      mockUploadedDocuments.splice(index, 1);
      return Promise.resolve();
    },

    // Update document data (after user corrections)
    updateDocument: async (documentId: string, updates: Partial<UploadedDocument>): Promise<UploadedDocument> => {
      const document = mockUploadedDocuments.find(doc => doc.id === documentId);
      if (!document) throw new Error('Document not found');
      
      Object.assign(document, updates);
      return Promise.resolve(document);
    },

    // Create invoice from uploaded document
    createInvoiceFromDocument: async (documentId: string): Promise<Invoice> => {
      const document = mockUploadedDocuments.find(doc => doc.id === documentId);
      if (!document || !document.parsedData) {
        throw new Error('Document not found or not processed');
      }

      const parsedData = document.parsedData;
      
      // Create a new invoice from the parsed data
      const newInvoice: CreateInvoiceDTO = {
        customer: parsedData.vendor.name, // Note: in upload context, vendor becomes the customer
        customerId: undefined, // Would need to match against existing customers
        amount: parsedData.totals.total,
        items: parsedData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.unitPrice
        })),
        type: 'Standard',
        projectId: undefined,
        number: parsedData.invoiceNumber,
        date: parsedData.date,
        dueDate: parsedData.dueDate
      };

      // Use existing invoice creation API
      return api.invoices.create(newInvoice);
    },

    // Get processing status
    getProcessingStatus: async (documentId: string): Promise<ProcessingStatus> => {
      const document = mockUploadedDocuments.find(doc => doc.id === documentId);
      if (!document) throw new Error('Document not found');

      const stageMap: Record<UploadedDocument['status'], ProcessingStatus['stage']> = {
        'uploading': 'upload',
        'processing': 'ocr',
        'completed': 'complete',
        'failed': 'validation'
      };

      return Promise.resolve({
        documentId: document.id,
        stage: stageMap[document.status],
        progress: document.processingProgress,
        message: `Document is ${document.status}`,
        timeElapsed: Date.now() - new Date(document.uploadedAt).getTime(),
        estimatedTimeRemaining: document.status === 'completed' ? 0 : (100 - document.processingProgress) * 200
      });
    },

    // Batch upload multiple files
    uploadFiles: async (files: File[]): Promise<UploadedDocument[]> => {
      const uploads = await Promise.all(
        files.map(file => api.upload.uploadFile(file))
      );
      return uploads;
    }
  }
};
