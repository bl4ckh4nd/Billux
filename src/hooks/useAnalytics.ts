import { useMemo } from 'react';
import { useInvoices } from './useInvoices';
import { useCustomers } from './useCustomers';
import { useProjects } from './useProjects';
import { usePayments } from './usePayments';
import {
  groupInvoicesByMonth,
  calculateInvoiceStatusDistribution,
  getTopCustomers,
  calculateProjectMetrics,
  calculateMRR,
  calculateYTD,
  calculateGrowthRate,
  getPaymentMethodDistribution,
  calculateCashFlow,
  calculateTaxAnalysis,
  calculateInvoiceAging,
  calculatePaymentVelocity,
  RevenueData,
  InvoiceStatusData,
  CashFlowData,
  TaxData,
  AgingData,
  PaymentVelocity
} from '../lib/analytics';
import { subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import type { Invoice } from '../types/invoice';

export interface DashboardMetrics {
  mrr: number;
  mrrGrowth: number;
  ytd: number;
  ytdGrowth: number;
  totalInvoices: number;
  overdueInvoices: number;
  overdueAmount: number;
  collectionRate: number;
  avgInvoiceValue: number;
  customerCount: number;
}

export interface RevenueAnalytics {
  monthlyRevenue: RevenueData[];
  metrics: DashboardMetrics;
}

export interface InvoiceAnalytics {
  statusDistribution: InvoiceStatusData[];
  overdueCount: number;
  overdueAmount: number;
  collectionRate: number;
}

export function useRevenueAnalytics() {
  const { invoices } = useInvoices();
  const { customers } = useCustomers();

  return useMemo(() => {
    if (!invoices || !customers) {
      return {
        monthlyRevenue: [],
        metrics: {
          mrr: 0,
          mrrGrowth: 0,
          ytd: 0,
          ytdGrowth: 0,
          totalInvoices: 0,
          overdueInvoices: 0,
          overdueAmount: 0,
          collectionRate: 0,
          avgInvoiceValue: 0,
          customerCount: 0
        }
      };
    }

    // Get monthly revenue data
    const monthlyRevenue = groupInvoicesByMonth(invoices);

    // Calculate current MRR
    const currentMRR = calculateMRR(invoices);
    
    // Calculate previous month MRR for growth
    const previousMonthStart = startOfMonth(subMonths(new Date(), 1));
    const previousMonthEnd = endOfMonth(subMonths(new Date(), 1));
    const previousMonthInvoices = invoices.filter(invoice => {
      const invoiceDate = parseISO(invoice.date);
      return isWithinInterval(invoiceDate, { start: previousMonthStart, end: previousMonthEnd });
    });
    const previousMRR = previousMonthInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const mrrGrowth = calculateGrowthRate(currentMRR, previousMRR);

    // Calculate YTD
    const ytd = calculateYTD(invoices);
    
    // Calculate previous year YTD for growth
    const previousYear = new Date().getFullYear() - 1;
    const previousYTDInvoices = invoices.filter(invoice => {
      const invoiceDate = parseISO(invoice.date);
      return invoiceDate.getFullYear() === previousYear &&
             invoiceDate.getMonth() <= new Date().getMonth();
    });
    const previousYTD = previousYTDInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const ytdGrowth = calculateGrowthRate(ytd, previousYTD);

    // Calculate overdue metrics
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

    // Calculate collection rate
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

    // Calculate average invoice value
    const avgInvoiceValue = invoices.length > 0 ? 
      invoices.reduce((sum, inv) => sum + inv.total, 0) / invoices.length : 0;

    return {
      monthlyRevenue,
      metrics: {
        mrr: currentMRR,
        mrrGrowth,
        ytd,
        ytdGrowth,
        totalInvoices: invoices.length,
        overdueInvoices: overdueInvoices.length,
        overdueAmount,
        collectionRate,
        avgInvoiceValue,
        customerCount: customers.length
      }
    };
  }, [invoices, customers]);
}

export function useInvoiceAnalytics() {
  const { invoices } = useInvoices();

  return useMemo(() => {
    if (!invoices) {
      return {
        statusDistribution: [],
        overdueCount: 0,
        overdueAmount: 0,
        collectionRate: 0
      };
    }

    const statusDistribution = calculateInvoiceStatusDistribution(invoices);
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

    return {
      statusDistribution,
      overdueCount: overdueInvoices.length,
      overdueAmount,
      collectionRate
    };
  }, [invoices]);
}

export function useCustomerAnalytics(limit: number = 5) {
  const { invoices } = useInvoices();
  const { customers } = useCustomers();

  return useMemo(() => {
    if (!invoices || !customers) {
      return {
        topCustomers: [],
        totalCustomers: 0,
        activeCustomers: 0
      };
    }

    const topCustomers = getTopCustomers(invoices, customers, limit);
    const activeCustomers = new Set(invoices.map(inv => inv.customerId)).size;

    return {
      topCustomers,
      totalCustomers: customers.length,
      activeCustomers
    };
  }, [invoices, customers, limit]);
}

export function useProjectAnalytics() {
  const { projects } = useProjects();
  const { invoices } = useInvoices();

  return useMemo(() => {
    if (!projects || !invoices) {
      return {
        projectMetrics: [],
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0
      };
    }

    const projectMetrics = calculateProjectMetrics(projects, invoices);
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    return {
      projectMetrics,
      totalProjects: projects.length,
      activeProjects,
      completedProjects
    };
  }, [projects, invoices]);
}

export function usePaymentAnalytics() {
  const { payments } = usePayments();
  const { invoices } = useInvoices();

  return useMemo(() => {
    if (!payments || !invoices) {
      return {
        methodDistribution: [],
        totalPayments: 0,
        avgPaymentTime: 0,
        recentPayments: []
      };
    }

    const methodDistribution = getPaymentMethodDistribution(payments);
    
    // Get recent payments
    const recentPayments = payments
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return {
      methodDistribution,
      totalPayments: payments.length,
      avgPaymentTime: 0, // Would need invoice creation date to calculate
      recentPayments
    };
  }, [payments, invoices]);
}

export interface FinanceAnalytics {
  cashFlow: CashFlowData[];
  taxAnalysis: TaxData;
  agingData: AgingData[];
  paymentVelocity: PaymentVelocity;
  upcomingPayments: { invoice: Invoice; daysUntilDue: number }[];
}

export function useFinanceAnalytics() {
  const { invoices } = useInvoices();
  const { payments } = usePayments();

  return useMemo(() => {
    if (!invoices) {
      return {
        cashFlow: [],
        taxAnalysis: {
          totalGross: 0,
          totalNet: 0,
          totalVat: 0,
          vatByRate: [],
          quarterlyTax: []
        },
        agingData: [],
        paymentVelocity: {
          averageDaysToPayment: 0,
          medianDaysToPayment: 0,
          paymentTrend: []
        },
        upcomingPayments: []
      };
    }

    // Calculate all finance metrics
    const cashFlow = calculateCashFlow(invoices);
    const taxAnalysis = calculateTaxAnalysis(invoices);
    const agingData = calculateInvoiceAging(invoices);
    const paymentVelocity = calculatePaymentVelocity(invoices);

    // Calculate upcoming payments (invoices due in next 30 days)
    const today = new Date();
    const upcomingPayments = invoices
      .filter(invoice => invoice.status === 'pending')
      .map(invoice => {
        const dueDate = new Date(invoice.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { invoice, daysUntilDue };
      })
      .filter(item => item.daysUntilDue > 0 && item.daysUntilDue <= 30)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    return {
      cashFlow,
      taxAnalysis,
      agingData,
      paymentVelocity,
      upcomingPayments
    };
  }, [invoices, payments]);
}