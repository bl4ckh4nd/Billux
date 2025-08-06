import { startOfMonth, endOfMonth, subMonths, format, parseISO, isWithinInterval } from 'date-fns';
import { Invoice, Customer, Project, Payment } from '../types/invoice';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface RevenueData {
  month: string;
  revenue: number;
  invoiceCount: number;
}

export interface InvoiceStatusData {
  status: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface CustomerInsight {
  customer: Customer;
  totalRevenue: number;
  invoiceCount: number;
  averageInvoiceValue: number;
  lastInvoiceDate: string;
}

export interface ProjectMetrics {
  project: Project;
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  completionRate: number;
}

export function getLastNMonths(n: number): DateRange[] {
  const ranges: DateRange[] = [];
  const currentDate = new Date();
  
  for (let i = 0; i < n; i++) {
    const date = subMonths(currentDate, i);
    ranges.unshift({
      start: startOfMonth(date),
      end: endOfMonth(date)
    });
  }
  
  return ranges;
}

export function groupInvoicesByMonth(invoices: Invoice[]): RevenueData[] {
  const monthlyData = new Map<string, { revenue: number; count: number }>();
  
  invoices.forEach(invoice => {
    const month = format(parseISO(invoice.date), 'yyyy-MM');
    const current = monthlyData.get(month) || { revenue: 0, count: 0 };
    
    monthlyData.set(month, {
      revenue: current.revenue + invoice.total,
      count: current.count + 1
    });
  });
  
  return Array.from(monthlyData.entries())
    .map(([month, data]) => ({
      month: format(parseISO(`${month}-01`), 'MMM yyyy'),
      revenue: data.revenue,
      invoiceCount: data.count
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function calculateInvoiceStatusDistribution(invoices: Invoice[]): InvoiceStatusData[] {
  const statusGroups = new Map<string, { count: number; amount: number }>();
  const total = invoices.length;
  
  invoices.forEach(invoice => {
    const status = invoice.status;
    const current = statusGroups.get(status) || { count: 0, amount: 0 };
    
    statusGroups.set(status, {
      count: current.count + 1,
      amount: current.amount + invoice.total
    });
  });
  
  return Array.from(statusGroups.entries()).map(([status, data]) => ({
    status,
    count: data.count,
    amount: data.amount,
    percentage: (data.count / total) * 100
  }));
}

export function getTopCustomers(invoices: Invoice[], customers: Customer[], limit: number = 5): CustomerInsight[] {
  const customerMap = new Map<string, CustomerInsight>();
  
  invoices.forEach(invoice => {
    if (!invoice.customerId) return;
    
    const customer = customers.find(c => c.id === invoice.customerId);
    if (!customer) return;
    
    const current = customerMap.get(customer.id) || {
      customer,
      totalRevenue: 0,
      invoiceCount: 0,
      averageInvoiceValue: 0,
      lastInvoiceDate: ''
    };
    
    customerMap.set(customer.id, {
      customer,
      totalRevenue: current.totalRevenue + invoice.total,
      invoiceCount: current.invoiceCount + 1,
      averageInvoiceValue: 0,
      lastInvoiceDate: invoice.date > current.lastInvoiceDate ? invoice.date : current.lastInvoiceDate
    });
  });
  
  const insights = Array.from(customerMap.values()).map(insight => ({
    ...insight,
    averageInvoiceValue: insight.totalRevenue / insight.invoiceCount
  }));
  
  return insights
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);
}

export function calculateProjectMetrics(projects: Project[], invoices: Invoice[]): ProjectMetrics[] {
  return projects.map(project => {
    const projectInvoices = invoices.filter(inv => inv.projectId === project.id);
    
    const totalRevenue = projectInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = projectInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const pendingAmount = totalRevenue - paidAmount;
    const completionRate = project.budget > 0 ? (totalRevenue / project.budget) * 100 : 0;
    
    return {
      project,
      totalRevenue,
      paidAmount,
      pendingAmount,
      completionRate: Math.min(completionRate, 100)
    };
  });
}

export function calculateMRR(invoices: Invoice[]): number {
  const currentMonth = startOfMonth(new Date());
  const endMonth = endOfMonth(new Date());
  
  const currentMonthInvoices = invoices.filter(invoice => {
    const invoiceDate = parseISO(invoice.date);
    return isWithinInterval(invoiceDate, { start: currentMonth, end: endMonth });
  });
  
  return currentMonthInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
}

export function calculateYTD(invoices: Invoice[]): number {
  const currentYear = new Date().getFullYear();
  
  const ytdInvoices = invoices.filter(invoice => {
    const invoiceDate = parseISO(invoice.date);
    return invoiceDate.getFullYear() === currentYear;
  });
  
  return ytdInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
}

export function calculateGrowthRate(currentValue: number, previousValue: number): number {
  if (previousValue === 0) return currentValue > 0 ? 100 : 0;
  return ((currentValue - previousValue) / previousValue) * 100;
}

export function getPaymentMethodDistribution(payments: Payment[]) {
  const methodCounts = new Map<string, number>();
  
  payments.forEach(payment => {
    const method = payment.method || 'Unspecified';
    methodCounts.set(method, (methodCounts.get(method) || 0) + 1);
  });
  
  const total = payments.length;
  
  return Array.from(methodCounts.entries()).map(([method, count]) => ({
    method,
    count,
    percentage: (count / total) * 100
  }));
}

// Finance-specific analytics functions

export interface CashFlowData {
  month: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  balance: number;
}

export function calculateCashFlow(invoices: Invoice[], startingBalance: number = 0): CashFlowData[] {
  const monthlyFlow = new Map<string, { inflow: number; outflow: number }>();
  
  // Group paid invoices by payment month
  invoices.forEach(invoice => {
    if (invoice.status === 'paid' && invoice.payments) {
      invoice.payments.forEach(payment => {
        const month = format(parseISO(payment.date), 'yyyy-MM');
        const current = monthlyFlow.get(month) || { inflow: 0, outflow: 0 };
        
        // For now, we only track inflow from invoice payments
        // Outflow would come from expenses which aren't implemented yet
        monthlyFlow.set(month, {
          inflow: current.inflow + payment.amount,
          outflow: current.outflow
        });
      });
    }
  });
  
  // Convert to array and calculate running balance
  let runningBalance = startingBalance;
  const flowData = Array.from(monthlyFlow.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => {
      const netFlow = data.inflow - data.outflow;
      runningBalance += netFlow;
      
      return {
        month: format(parseISO(`${month}-01`), 'MMM yyyy'),
        inflow: data.inflow,
        outflow: data.outflow,
        netFlow,
        balance: runningBalance
      };
    });
  
  return flowData;
}

export interface TaxData {
  totalGross: number;
  totalNet: number;
  totalVat: number;
  vatByRate: { rate: number; amount: number }[];
  quarterlyTax: { quarter: string; vatAmount: number; netAmount: number }[];
}

export function calculateTaxAnalysis(invoices: Invoice[]): TaxData {
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const vatByRate = new Map<number, number>();
  const quarterlyData = new Map<string, { vat: number; net: number }>();
  
  let totalGross = 0;
  let totalNet = 0;
  let totalVat = 0;
  
  paidInvoices.forEach(invoice => {
    totalGross += invoice.total;
    totalNet += invoice.subtotal;
    totalVat += invoice.tax;
    
    // Group by VAT rate (assuming standard 19% if not specified)
    const vatRate = 19; // Default rate, could be extracted from invoice items
    vatByRate.set(vatRate, (vatByRate.get(vatRate) || 0) + invoice.tax);
    
    // Group by quarter
    const date = parseISO(invoice.date);
    const quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
    const current = quarterlyData.get(quarter) || { vat: 0, net: 0 };
    quarterlyData.set(quarter, {
      vat: current.vat + invoice.tax,
      net: current.net + invoice.subtotal
    });
  });
  
  return {
    totalGross,
    totalNet,
    totalVat,
    vatByRate: Array.from(vatByRate.entries()).map(([rate, amount]) => ({ rate, amount })),
    quarterlyTax: Array.from(quarterlyData.entries()).map(([quarter, data]) => ({
      quarter,
      vatAmount: data.vat,
      netAmount: data.net
    }))
  };
}

export interface AgingData {
  bucket: string;
  count: number;
  amount: number;
  percentage: number;
}

export function calculateInvoiceAging(invoices: Invoice[]): AgingData[] {
  const today = new Date();
  const buckets = new Map<string, { count: number; amount: number }>();
  
  const unpaidInvoices = invoices.filter(inv => 
    inv.status === 'pending' || inv.status === 'overdue'
  );
  
  unpaidInvoices.forEach(invoice => {
    const invoiceDate = parseISO(invoice.date);
    const daysOld = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let bucket: string;
    if (daysOld <= 30) bucket = '0-30 days';
    else if (daysOld <= 60) bucket = '31-60 days';
    else if (daysOld <= 90) bucket = '61-90 days';
    else bucket = '90+ days';
    
    const current = buckets.get(bucket) || { count: 0, amount: 0 };
    buckets.set(bucket, {
      count: current.count + 1,
      amount: current.amount + invoice.total
    });
  });
  
  const totalAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  
  // Ensure all buckets exist even if empty
  const allBuckets = ['0-30 days', '31-60 days', '61-90 days', '90+ days'];
  allBuckets.forEach(bucket => {
    if (!buckets.has(bucket)) {
      buckets.set(bucket, { count: 0, amount: 0 });
    }
  });
  
  return Array.from(buckets.entries()).map(([bucket, data]) => ({
    bucket,
    count: data.count,
    amount: data.amount,
    percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
  }));
}

export interface PaymentVelocity {
  averageDaysToPayment: number;
  medianDaysToPayment: number;
  paymentTrend: { month: string; avgDays: number }[];
}

export function calculatePaymentVelocity(invoices: Invoice[]): PaymentVelocity {
  const paidInvoices = invoices.filter(inv => 
    inv.status === 'paid' && inv.payments && inv.payments.length > 0
  );
  
  const daysToPayment: number[] = [];
  const monthlyData = new Map<string, number[]>();
  
  paidInvoices.forEach(invoice => {
    const invoiceDate = parseISO(invoice.date);
    const firstPayment = invoice.payments![0];
    const paymentDate = parseISO(firstPayment.date);
    const days = Math.floor((paymentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    daysToPayment.push(days);
    
    // Group by month for trend
    const month = format(invoiceDate, 'yyyy-MM');
    const monthDays = monthlyData.get(month) || [];
    monthDays.push(days);
    monthlyData.set(month, monthDays);
  });
  
  // Calculate average and median
  const avgDays = daysToPayment.length > 0 
    ? daysToPayment.reduce((sum, days) => sum + days, 0) / daysToPayment.length 
    : 0;
  
  const sortedDays = [...daysToPayment].sort((a, b) => a - b);
  const medianDays = sortedDays.length > 0
    ? sortedDays.length % 2 === 0
      ? (sortedDays[sortedDays.length / 2 - 1] + sortedDays[sortedDays.length / 2]) / 2
      : sortedDays[Math.floor(sortedDays.length / 2)]
    : 0;
  
  // Calculate monthly trend
  const paymentTrend = Array.from(monthlyData.entries())
    .map(([month, days]) => ({
      month: format(parseISO(`${month}-01`), 'MMM yyyy'),
      avgDays: days.reduce((sum, d) => sum + d, 0) / days.length
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months
  
  return {
    averageDaysToPayment: avgDays,
    medianDaysToPayment: medianDays,
    paymentTrend
  };
}