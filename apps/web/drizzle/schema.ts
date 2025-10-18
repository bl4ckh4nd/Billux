import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import {
  index as sqliteIndex,
  integer as sqliteInteger,
  real as sqliteReal,
  sqliteTable,
  text as sqliteText,
  uniqueIndex as sqliteUniqueIndex,
} from 'drizzle-orm/sqlite-core';
import {
  boolean as pgBoolean,
  index as pgIndex,
  integer as pgInteger,
  jsonb,
  numeric as pgNumeric,
  pgTable,
  text as pgText,
  timestamp as pgTimestamp,
  uniqueIndex as pgUniqueIndex,
} from 'drizzle-orm/pg-core';

// ----------------------------
// SQLite schema definitions
// ----------------------------

export const sqliteCustomers = sqliteTable(
  'customers',
  {
    id: sqliteText('id').primaryKey(),
    company: sqliteText('company').notNull(),
    contactPerson: sqliteText('contact_person'),
    taxId: sqliteText('tax_id').notNull(),
    street: sqliteText('street').notNull(),
    postalCode: sqliteText('postal_code').notNull(),
    city: sqliteText('city').notNull(),
    address: sqliteText('address'),
    email: sqliteText('email').notNull(),
    phone: sqliteText('phone').notNull(),
    projects: sqliteText('projects', { mode: 'json' }),
    totalRevenue: sqliteReal('total_revenue').notNull().default(0),
    lastInvoiceDate: sqliteText('last_invoice_date'),
    createdAt: sqliteText('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: sqliteText('updated_at').default(sql`CURRENT_TIMESTAMP`),
    notes: sqliteText('notes'),
    creditLimit: sqliteReal('credit_limit'),
    paymentTerms: sqliteText('payment_terms'),
    outstandingBalance: sqliteReal('outstanding_balance'),
    totalInvoices: sqliteInteger('total_invoices'),
    averageInvoiceValue: sqliteReal('average_invoice_value'),
    onTimePaymentRate: sqliteReal('on_time_payment_rate'),
    preferredPaymentMethod: sqliteText('preferred_payment_method'),
    averagePaymentDelay: sqliteInteger('average_payment_delay'),
  },
  (table) => ({
    taxIdIdx: sqliteUniqueIndex('customers_tax_id_idx').on(table.taxId),
    emailIdx: sqliteUniqueIndex('customers_email_idx').on(table.email),
    companyIdx: sqliteIndex('customers_company_idx').on(table.company),
  }),
);

export const sqliteProjects = sqliteTable(
  'projects',
  {
    id: sqliteText('id').primaryKey(),
    title: sqliteText('title').notNull(),
    name: sqliteText('name'),
    description: sqliteText('description').notNull(),
    customerId: sqliteText('customer_id').notNull().references(() => sqliteCustomers.id),
    customerName: sqliteText('customer_name'),
    status: sqliteText('status').notNull(),
    startDate: sqliteText('start_date').notNull(),
    endDate: sqliteText('end_date').notNull(),
    budget: sqliteReal('budget').notNull().default(0),
    totalValue: sqliteReal('total_value'),
    invoices: sqliteText('invoices', { mode: 'json' }),
    invoicedValue: sqliteReal('invoiced_value'),
    totalInvoiced: sqliteReal('total_invoiced'),
    totalPaid: sqliteReal('total_paid'),
    outstandingBalance: sqliteReal('outstanding_balance'),
    remainingValue: sqliteReal('remaining_value'),
    progressPercentage: sqliteReal('progress_percentage'),
    daysRemaining: sqliteInteger('days_remaining'),
    isOverdue: sqliteInteger('is_overdue', { mode: 'boolean' }),
    createdAt: sqliteText('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: sqliteText('updated_at').default(sql`CURRENT_TIMESTAMP`),
    notes: sqliteText('notes'),
    milestones: sqliteText('milestones', { mode: 'json' }),
    documents: sqliteText('documents', { mode: 'json' }),
    tasks: sqliteText('tasks', { mode: 'json' }),
  },
  (table) => ({
    customerIdx: sqliteIndex('projects_customer_idx').on(table.customerId),
    statusIdx: sqliteIndex('projects_status_idx').on(table.status),
  }),
);

export const sqliteArticles = sqliteTable(
  'articles',
  {
    id: sqliteText('id').primaryKey(),
    name: sqliteText('name').notNull(),
    description: sqliteText('description').notNull(),
    unit: sqliteText('unit').notNull(),
    basePrice: sqliteReal('base_price').notNull(),
    category: sqliteText('category').notNull(),
    isActive: sqliteInteger('is_active', { mode: 'boolean' }).default(1),
    stock: sqliteInteger('stock'),
    minStock: sqliteInteger('min_stock'),
    taxRate: sqliteReal('tax_rate'),
    notes: sqliteText('notes'),
    createdAt: sqliteText('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: sqliteText('updated_at').default(sql`CURRENT_TIMESTAMP`),
    usageCount: sqliteInteger('usage_count'),
    totalRevenue: sqliteReal('total_revenue'),
    lastUsedDate: sqliteText('last_used_date'),
    averageQuantity: sqliteReal('average_quantity'),
    stockValue: sqliteReal('stock_value'),
  },
  (table) => ({
    categoryIdx: sqliteIndex('articles_category_idx').on(table.category),
    nameIdx: sqliteIndex('articles_name_idx').on(table.name),
  }),
);

export const sqliteInvoices = sqliteTable(
  'invoices',
  {
    id: sqliteText('id').primaryKey(),
    number: sqliteText('number').notNull(),
    date: sqliteText('date').notNull(),
    customer: sqliteText('customer').notNull(),
    customerId: sqliteText('customer_id').references(() => sqliteCustomers.id),
    projectId: sqliteText('project_id').references(() => sqliteProjects.id),
    amount: sqliteReal('amount').notNull(),
    status: sqliteText('status').notNull(),
    dueDate: sqliteText('due_date').notNull(),
    paidAmount: sqliteReal('paid_amount').notNull().default(0),
    type: sqliteText('type').notNull(),
    previousInvoices: sqliteText('previous_invoices', { mode: 'json' }),
    paymentLink: sqliteText('payment_link'),
    paymentLinkToken: sqliteText('payment_link_token'),
    paymentLinkExpiresAt: sqliteText('payment_link_expires_at'),
    lastEmailSentAt: sqliteText('last_email_sent_at'),
    reminderStatus: sqliteText('reminder_status'),
    metadata: sqliteText('metadata', { mode: 'json' }),
    daysUntilDue: sqliteInteger('days_until_due'),
    isOverdue: sqliteInteger('is_overdue', { mode: 'boolean' }),
  },
  (table) => ({
    numberIdx: sqliteUniqueIndex('invoices_number_idx').on(table.number),
    customerIdx: sqliteIndex('invoices_customer_idx').on(table.customerId),
    statusIdx: sqliteIndex('invoices_status_idx').on(table.status),
    dueDateIdx: sqliteIndex('invoices_due_date_idx').on(table.dueDate),
  }),
);

export const sqliteInvoiceItems = sqliteTable(
  'invoice_items',
  {
    id: sqliteText('id').primaryKey(),
    invoiceId: sqliteText('invoice_id').notNull().references(() => sqliteInvoices.id, { onDelete: 'cascade' }),
    articleId: sqliteText('article_id').references(() => sqliteArticles.id),
    description: sqliteText('description'),
    quantity: sqliteInteger('quantity').notNull(),
    unitPrice: sqliteReal('unit_price').notNull(),
  },
  (table) => ({
    invoiceIdx: sqliteIndex('invoice_items_invoice_idx').on(table.invoiceId),
    articleIdx: sqliteIndex('invoice_items_article_idx').on(table.articleId),
  }),
);

export const sqlitePayments = sqliteTable(
  'payments',
  {
    id: sqliteText('id').primaryKey(),
    invoiceId: sqliteText('invoice_id').notNull().references(() => sqliteInvoices.id, { onDelete: 'cascade' }),
    date: sqliteText('date').notNull(),
    amount: sqliteReal('amount').notNull(),
    method: sqliteText('method').notNull(),
    reference: sqliteText('reference').notNull(),
    gatewayTransactionId: sqliteText('gateway_transaction_id'),
    gatewayProvider: sqliteText('gateway_provider'),
    gatewayMetadata: sqliteText('gateway_metadata', { mode: 'json' }),
  },
  (table) => ({
    invoiceIdx: sqliteIndex('payments_invoice_idx').on(table.invoiceId),
    dateIdx: sqliteIndex('payments_date_idx').on(table.date),
  }),
);

export const sqliteEmailActivities = sqliteTable(
  'email_activities',
  {
    id: sqliteText('id').primaryKey(),
    invoiceId: sqliteText('invoice_id').notNull().references(() => sqliteInvoices.id, { onDelete: 'cascade' }),
    type: sqliteText('type').notNull(),
    sentAt: sqliteText('sent_at').notNull(),
    status: sqliteText('status').notNull(),
    recipient: sqliteText('recipient').notNull(),
    subject: sqliteText('subject').notNull(),
    errorMessage: sqliteText('error_message'),
    messageId: sqliteText('message_id'),
    openedAt: sqliteText('opened_at'),
    clickedAt: sqliteText('clicked_at'),
  },
  (table) => ({
    invoiceIdx: sqliteIndex('email_activities_invoice_idx').on(table.invoiceId),
    sentAtIdx: sqliteIndex('email_activities_sent_at_idx').on(table.sentAt),
  }),
);

export const sqliteReminders = sqliteTable(
  'reminders',
  {
    id: sqliteText('id').primaryKey(),
    invoiceId: sqliteText('invoice_id').notNull().references(() => sqliteInvoices.id, { onDelete: 'cascade' }),
    invoiceNumber: sqliteText('invoice_number').notNull(),
    customerId: sqliteText('customer_id').notNull().references(() => sqliteCustomers.id),
    customerName: sqliteText('customer_name').notNull(),
    level: sqliteInteger('level').notNull(),
    status: sqliteText('status').notNull(),
    sentDate: sqliteText('sent_date').notNull(),
    dueDate: sqliteText('due_date').notNull(),
    originalAmount: sqliteReal('original_amount').notNull(),
    reminderFee: sqliteReal('reminder_fee').notNull(),
    interestAmount: sqliteReal('interest_amount').notNull(),
    totalAmount: sqliteReal('total_amount').notNull(),
    template: sqliteText('template').notNull(),
    emailSubject: sqliteText('email_subject').notNull(),
    emailBody: sqliteText('email_body').notNull(),
    attachments: sqliteText('attachments', { mode: 'json' }),
    response: sqliteText('response', { mode: 'json' }),
    createdAt: sqliteText('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: sqliteText('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    invoiceIdx: sqliteIndex('reminders_invoice_idx').on(table.invoiceId),
    customerIdx: sqliteIndex('reminders_customer_idx').on(table.customerId),
    statusIdx: sqliteIndex('reminders_status_idx').on(table.status),
  }),
);

export const sqliteAuditEntries = sqliteTable(
  'audit_entries',
  {
    id: sqliteText('id').primaryKey(),
    timestamp: sqliteText('timestamp').notNull(),
    userId: sqliteText('user_id').notNull(),
    documentId: sqliteText('document_id').notNull(),
    documentType: sqliteText('document_type').notNull(),
    action: sqliteText('action').notNull(),
    changes: sqliteText('changes', { mode: 'json' }),
    metadata: sqliteText('metadata', { mode: 'json' }),
  },
  (table) => ({
    documentIdx: sqliteIndex('audit_document_idx').on(table.documentId),
    userIdx: sqliteIndex('audit_user_idx').on(table.userId),
  }),
);

export const sqliteCustomersRelations = relations(sqliteCustomers, ({ many }) => ({
  projects: many(sqliteProjects),
  invoices: many(sqliteInvoices),
  reminders: many(sqliteReminders),
}));

export const sqliteProjectsRelations = relations(sqliteProjects, ({ one, many }) => ({
  customer: one(sqliteCustomers, {
    fields: [sqliteProjects.customerId],
    references: [sqliteCustomers.id],
  }),
  invoices: many(sqliteInvoices),
}));

export const sqliteArticlesRelations = relations(sqliteArticles, ({ many }) => ({
  invoiceItems: many(sqliteInvoiceItems),
}));

export const sqliteInvoicesRelations = relations(sqliteInvoices, ({ one, many }) => ({
  customer: one(sqliteCustomers, {
    fields: [sqliteInvoices.customerId],
    references: [sqliteCustomers.id],
  }),
  project: one(sqliteProjects, {
    fields: [sqliteInvoices.projectId],
    references: [sqliteProjects.id],
  }),
  items: many(sqliteInvoiceItems),
  payments: many(sqlitePayments),
  emailActivities: many(sqliteEmailActivities),
  reminders: many(sqliteReminders),
}));

export const sqliteInvoiceItemsRelations = relations(sqliteInvoiceItems, ({ one }) => ({
  invoice: one(sqliteInvoices, {
    fields: [sqliteInvoiceItems.invoiceId],
    references: [sqliteInvoices.id],
  }),
  article: one(sqliteArticles, {
    fields: [sqliteInvoiceItems.articleId],
    references: [sqliteArticles.id],
  }),
}));

export const sqlitePaymentsRelations = relations(sqlitePayments, ({ one }) => ({
  invoice: one(sqliteInvoices, {
    fields: [sqlitePayments.invoiceId],
    references: [sqliteInvoices.id],
  }),
}));

export const sqliteEmailActivitiesRelations = relations(sqliteEmailActivities, ({ one }) => ({
  invoice: one(sqliteInvoices, {
    fields: [sqliteEmailActivities.invoiceId],
    references: [sqliteInvoices.id],
  }),
}));

export const sqliteRemindersRelations = relations(sqliteReminders, ({ one }) => ({
  invoice: one(sqliteInvoices, {
    fields: [sqliteReminders.invoiceId],
    references: [sqliteInvoices.id],
  }),
  customer: one(sqliteCustomers, {
    fields: [sqliteReminders.customerId],
    references: [sqliteCustomers.id],
  }),
}));

export const sqliteSchema = {
  customers: sqliteCustomers,
  projects: sqliteProjects,
  articles: sqliteArticles,
  invoices: sqliteInvoices,
  invoiceItems: sqliteInvoiceItems,
  payments: sqlitePayments,
  emailActivities: sqliteEmailActivities,
  reminders: sqliteReminders,
  auditEntries: sqliteAuditEntries,
};

// ----------------------------
// Postgres schema definitions
// ----------------------------

export const pgCustomers = pgTable(
  'customers',
  {
    id: pgText('id').primaryKey(),
    company: pgText('company').notNull(),
    contactPerson: pgText('contact_person'),
    taxId: pgText('tax_id').notNull(),
    street: pgText('street').notNull(),
    postalCode: pgText('postal_code').notNull(),
    city: pgText('city').notNull(),
    address: pgText('address'),
    email: pgText('email').notNull(),
    phone: pgText('phone').notNull(),
    projects: jsonb('projects').$type<string[] | null>(),
    totalRevenue: pgNumeric('total_revenue').notNull().default('0'),
    lastInvoiceDate: pgText('last_invoice_date'),
    createdAt: pgTimestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: pgTimestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    notes: pgText('notes'),
    creditLimit: pgNumeric('credit_limit'),
    paymentTerms: pgText('payment_terms'),
    outstandingBalance: pgNumeric('outstanding_balance'),
    totalInvoices: pgInteger('total_invoices'),
    averageInvoiceValue: pgNumeric('average_invoice_value'),
    onTimePaymentRate: pgNumeric('on_time_payment_rate'),
    preferredPaymentMethod: pgText('preferred_payment_method'),
    averagePaymentDelay: pgInteger('average_payment_delay'),
  },
  (table) => ({
    taxIdIdx: pgUniqueIndex('pg_customers_tax_id_idx').on(table.taxId),
    emailIdx: pgUniqueIndex('pg_customers_email_idx').on(table.email),
    companyIdx: pgIndex('pg_customers_company_idx').on(table.company),
  }),
);

export const pgProjects = pgTable(
  'projects',
  {
    id: pgText('id').primaryKey(),
    title: pgText('title').notNull(),
    name: pgText('name'),
    description: pgText('description').notNull(),
    customerId: pgText('customer_id').notNull().references(() => pgCustomers.id),
    customerName: pgText('customer_name'),
    status: pgText('status').notNull(),
    startDate: pgText('start_date').notNull(),
    endDate: pgText('end_date').notNull(),
    budget: pgNumeric('budget').notNull().default('0'),
    totalValue: pgNumeric('total_value'),
    invoices: jsonb('invoices').$type<string[] | null>(),
    invoicedValue: pgNumeric('invoiced_value'),
    totalInvoiced: pgNumeric('total_invoiced'),
    totalPaid: pgNumeric('total_paid'),
    outstandingBalance: pgNumeric('outstanding_balance'),
    remainingValue: pgNumeric('remaining_value'),
    progressPercentage: pgNumeric('progress_percentage'),
    daysRemaining: pgInteger('days_remaining'),
    isOverdue: pgBoolean('is_overdue'),
    createdAt: pgTimestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: pgTimestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    notes: pgText('notes'),
    milestones: jsonb('milestones').$type<unknown[] | null>(),
    documents: jsonb('documents').$type<unknown[] | null>(),
    tasks: jsonb('tasks').$type<unknown[] | null>(),
  },
  (table) => ({
    customerIdx: pgIndex('pg_projects_customer_idx').on(table.customerId),
    statusIdx: pgIndex('pg_projects_status_idx').on(table.status),
  }),
);

export const pgArticles = pgTable(
  'articles',
  {
    id: pgText('id').primaryKey(),
    name: pgText('name').notNull(),
    description: pgText('description').notNull(),
    unit: pgText('unit').notNull(),
    basePrice: pgNumeric('base_price').notNull(),
    category: pgText('category').notNull(),
    isActive: pgBoolean('is_active').default(true),
    stock: pgInteger('stock'),
    minStock: pgInteger('min_stock'),
    taxRate: pgNumeric('tax_rate'),
    notes: pgText('notes'),
    createdAt: pgTimestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: pgTimestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    usageCount: pgInteger('usage_count'),
    totalRevenue: pgNumeric('total_revenue'),
    lastUsedDate: pgText('last_used_date'),
    averageQuantity: pgNumeric('average_quantity'),
    stockValue: pgNumeric('stock_value'),
  },
  (table) => ({
    categoryIdx: pgIndex('pg_articles_category_idx').on(table.category),
    nameIdx: pgIndex('pg_articles_name_idx').on(table.name),
  }),
);

export const pgInvoices = pgTable(
  'invoices',
  {
    id: pgText('id').primaryKey(),
    number: pgText('number').notNull(),
    date: pgText('date').notNull(),
    customer: pgText('customer').notNull(),
    customerId: pgText('customer_id').references(() => pgCustomers.id),
    projectId: pgText('project_id').references(() => pgProjects.id),
    amount: pgNumeric('amount').notNull(),
    status: pgText('status').notNull(),
    dueDate: pgText('due_date').notNull(),
    paidAmount: pgNumeric('paid_amount').notNull().default('0'),
    type: pgText('type').notNull(),
    previousInvoices: jsonb('previous_invoices').$type<string[] | null>(),
    paymentLink: pgText('payment_link'),
    paymentLinkToken: pgText('payment_link_token'),
    paymentLinkExpiresAt: pgText('payment_link_expires_at'),
    lastEmailSentAt: pgText('last_email_sent_at'),
    reminderStatus: pgText('reminder_status'),
    metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
    daysUntilDue: pgInteger('days_until_due'),
    isOverdue: pgBoolean('is_overdue'),
  },
  (table) => ({
    numberIdx: pgUniqueIndex('pg_invoices_number_idx').on(table.number),
    customerIdx: pgIndex('pg_invoices_customer_idx').on(table.customerId),
    statusIdx: pgIndex('pg_invoices_status_idx').on(table.status),
    dueDateIdx: pgIndex('pg_invoices_due_date_idx').on(table.dueDate),
  }),
);

export const pgInvoiceItems = pgTable(
  'invoice_items',
  {
    id: pgText('id').primaryKey(),
    invoiceId: pgText('invoice_id').notNull().references(() => pgInvoices.id, { onDelete: 'cascade' }),
    articleId: pgText('article_id').references(() => pgArticles.id),
    description: pgText('description'),
    quantity: pgInteger('quantity').notNull(),
    unitPrice: pgNumeric('unit_price').notNull(),
  },
  (table) => ({
    invoiceIdx: pgIndex('pg_invoice_items_invoice_idx').on(table.invoiceId),
    articleIdx: pgIndex('pg_invoice_items_article_idx').on(table.articleId),
  }),
);

export const pgPayments = pgTable(
  'payments',
  {
    id: pgText('id').primaryKey(),
    invoiceId: pgText('invoice_id').notNull().references(() => pgInvoices.id, { onDelete: 'cascade' }),
    date: pgText('date').notNull(),
    amount: pgNumeric('amount').notNull(),
    method: pgText('method').notNull(),
    reference: pgText('reference').notNull(),
    gatewayTransactionId: pgText('gateway_transaction_id'),
    gatewayProvider: pgText('gateway_provider'),
    gatewayMetadata: jsonb('gateway_metadata').$type<Record<string, unknown> | null>(),
  },
  (table) => ({
    invoiceIdx: pgIndex('pg_payments_invoice_idx').on(table.invoiceId),
    dateIdx: pgIndex('pg_payments_date_idx').on(table.date),
  }),
);

export const pgEmailActivities = pgTable(
  'email_activities',
  {
    id: pgText('id').primaryKey(),
    invoiceId: pgText('invoice_id').notNull().references(() => pgInvoices.id, { onDelete: 'cascade' }),
    type: pgText('type').notNull(),
    sentAt: pgText('sent_at').notNull(),
    status: pgText('status').notNull(),
    recipient: pgText('recipient').notNull(),
    subject: pgText('subject').notNull(),
    errorMessage: pgText('error_message'),
    messageId: pgText('message_id'),
    openedAt: pgText('opened_at'),
    clickedAt: pgText('clicked_at'),
  },
  (table) => ({
    invoiceIdx: pgIndex('pg_email_activities_invoice_idx').on(table.invoiceId),
    sentAtIdx: pgIndex('pg_email_activities_sent_at_idx').on(table.sentAt),
  }),
);

export const pgReminders = pgTable(
  'reminders',
  {
    id: pgText('id').primaryKey(),
    invoiceId: pgText('invoice_id').notNull().references(() => pgInvoices.id, { onDelete: 'cascade' }),
    invoiceNumber: pgText('invoice_number').notNull(),
    customerId: pgText('customer_id').notNull().references(() => pgCustomers.id),
    customerName: pgText('customer_name').notNull(),
    level: pgInteger('level').notNull(),
    status: pgText('status').notNull(),
    sentDate: pgText('sent_date').notNull(),
    dueDate: pgText('due_date').notNull(),
    originalAmount: pgNumeric('original_amount').notNull(),
    reminderFee: pgNumeric('reminder_fee').notNull(),
    interestAmount: pgNumeric('interest_amount').notNull(),
    totalAmount: pgNumeric('total_amount').notNull(),
    template: pgText('template').notNull(),
    emailSubject: pgText('email_subject').notNull(),
    emailBody: pgText('email_body').notNull(),
    attachments: jsonb('attachments').$type<string[] | null>(),
    response: jsonb('response').$type<Record<string, unknown> | null>(),
    createdAt: pgTimestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: pgTimestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow(),
  },
  (table) => ({
    invoiceIdx: pgIndex('pg_reminders_invoice_idx').on(table.invoiceId),
    customerIdx: pgIndex('pg_reminders_customer_idx').on(table.customerId),
    statusIdx: pgIndex('pg_reminders_status_idx').on(table.status),
  }),
);

export const pgAuditEntries = pgTable(
  'audit_entries',
  {
    id: pgText('id').primaryKey(),
    timestamp: pgTimestamp('timestamp', { withTimezone: true, mode: 'string' }).notNull(),
    userId: pgText('user_id').notNull(),
    documentId: pgText('document_id').notNull(),
    documentType: pgText('document_type').notNull(),
    action: pgText('action').notNull(),
    changes: jsonb('changes').$type<Record<string, unknown>[] | null>(),
    metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
  },
  (table) => ({
    documentIdx: pgIndex('pg_audit_document_idx').on(table.documentId),
    userIdx: pgIndex('pg_audit_user_idx').on(table.userId),
  }),
);

export const pgCustomersRelations = relations(pgCustomers, ({ many }) => ({
  projects: many(pgProjects),
  invoices: many(pgInvoices),
  reminders: many(pgReminders),
}));

export const pgProjectsRelations = relations(pgProjects, ({ one, many }) => ({
  customer: one(pgCustomers, {
    fields: [pgProjects.customerId],
    references: [pgCustomers.id],
  }),
  invoices: many(pgInvoices),
}));

export const pgArticlesRelations = relations(pgArticles, ({ many }) => ({
  invoiceItems: many(pgInvoiceItems),
}));

export const pgInvoicesRelations = relations(pgInvoices, ({ one, many }) => ({
  customer: one(pgCustomers, {
    fields: [pgInvoices.customerId],
    references: [pgCustomers.id],
  }),
  project: one(pgProjects, {
    fields: [pgInvoices.projectId],
    references: [pgProjects.id],
  }),
  items: many(pgInvoiceItems),
  payments: many(pgPayments),
  emailActivities: many(pgEmailActivities),
  reminders: many(pgReminders),
}));

export const pgInvoiceItemsRelations = relations(pgInvoiceItems, ({ one }) => ({
  invoice: one(pgInvoices, {
    fields: [pgInvoiceItems.invoiceId],
    references: [pgInvoices.id],
  }),
  article: one(pgArticles, {
    fields: [pgInvoiceItems.articleId],
    references: [pgArticles.id],
  }),
}));

export const pgPaymentsRelations = relations(pgPayments, ({ one }) => ({
  invoice: one(pgInvoices, {
    fields: [pgPayments.invoiceId],
    references: [pgInvoices.id],
  }),
}));

export const pgEmailActivitiesRelations = relations(pgEmailActivities, ({ one }) => ({
  invoice: one(pgInvoices, {
    fields: [pgEmailActivities.invoiceId],
    references: [pgInvoices.id],
  }),
}));

export const pgRemindersRelations = relations(pgReminders, ({ one }) => ({
  invoice: one(pgInvoices, {
    fields: [pgReminders.invoiceId],
    references: [pgInvoices.id],
  }),
  customer: one(pgCustomers, {
    fields: [pgReminders.customerId],
    references: [pgCustomers.id],
  }),
}));

export const postgresSchema = {
  customers: pgCustomers,
  projects: pgProjects,
  articles: pgArticles,
  invoices: pgInvoices,
  invoiceItems: pgInvoiceItems,
  payments: pgPayments,
  emailActivities: pgEmailActivities,
  reminders: pgReminders,
  auditEntries: pgAuditEntries,
};
