import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Euro,
  Filter,
  Calendar,
  Users,
  Download,
  BarChart3,
  Activity
} from 'lucide-react';
import { useInvoices, useDeleteInvoice } from '../hooks/useInvoices';
import { useDownloadPdf } from '../hooks/usePdfGeneration';
import InvoiceDetail from './InvoiceDetail';
import InvoiceForm from './InvoiceForm';
import { InvoiceTable } from './InvoiceTable';
import type { Invoice } from '../types/invoice';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  color: string;
  bgColor: string;
}

interface InvoiceOverviewProps {
  onInvoiceClick?: (invoiceId: string) => void;
}

const InvoiceOverview: React.FC<InvoiceOverviewProps> = ({ onInvoiceClick }) => {
  const { data: invoices = [], isLoading } = useInvoices();
  const deleteInvoice = useDeleteInvoice();
  const [currentView, setCurrentView] = useState<'overview' | 'detail' | 'form'>('overview');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  const stats = useMemo(() => {
    if (!invoices.length) return {
      total: 0,
      outstanding: 0,
      paid: 0,
      overdue: 0,
      offen: 0,
      teilweiseBezahlt: 0,
      averagePaymentTime: 0,
      monthlyTotal: 0,
      yearlyTotal: 0,
    };

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return invoices.reduce((acc, invoice) => {
      const invoiceDate = new Date(invoice.date);
      const isCurrentMonth = invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
      const isCurrentYear = invoiceDate.getFullYear() === currentYear;

      acc.total += invoice.amount;
      
      if (invoice.status === 'Bezahlt') {
        acc.paid += invoice.amount;
      } else if (invoice.status === 'Offen') {
        acc.offen += 1;
        acc.outstanding += invoice.amount;
        if (new Date(invoice.dueDate) < now) {
          acc.overdue += invoice.amount;
        }
      } else if (invoice.status === 'Überfällig') {
        acc.overdue += invoice.amount;
        acc.outstanding += invoice.amount;
      } else if (invoice.status === 'Teilweise bezahlt') {
        acc.teilweiseBezahlt += 1;
        acc.outstanding += invoice.amount - invoice.paidAmount;
      }

      if (isCurrentMonth) {
        acc.monthlyTotal += invoice.amount;
      }
      if (isCurrentYear) {
        acc.yearlyTotal += invoice.amount;
      }

      return acc;
    }, {
      total: 0,
      outstanding: 0,
      paid: 0,
      overdue: 0,
      offen: 0,
      teilweiseBezahlt: 0,
      averagePaymentTime: 0,
      monthlyTotal: 0,
      yearlyTotal: 0,
    });
  }, [invoices]);

  const tabs: TabConfig[] = [
    {
      id: 'all',
      label: 'Alle Rechnungen',
      icon: FileText,
      count: invoices.length,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
    },
    {
      id: 'sent',
      label: 'Offen',
      icon: Clock,
      count: stats.offen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      id: 'paid',
      label: 'Bezahlt',
      icon: CheckCircle,
      count: invoices.filter(i => i.status === 'Bezahlt').length,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      id: 'overdue',
      label: 'Überfällig',
      icon: AlertCircle,
      count: invoices.filter(i => i.status === 'Überfällig' || (i.status === 'Offen' && new Date(i.dueDate) < new Date())).length,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      id: 'partial',
      label: 'Teilweise bezahlt',
      icon: Clock,
      count: stats.teilweiseBezahlt,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const handleInvoiceClick = (invoice: Invoice) => {
    if (onInvoiceClick) {
      // Use the prop-based navigation from App.tsx
      onInvoiceClick(invoice.id);
    } else {
      // Fallback to internal state management
      setSelectedInvoice(invoice);
      setCurrentView('detail');
    }
  };

  const handleNewInvoice = () => {
    setCurrentView('form');
  };

  const handleBackToOverview = () => {
    setCurrentView('overview');
    setSelectedInvoice(null);
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCurrentView('form');
  };

  const handleDelete = async (invoice: Invoice) => {
    if (window.confirm(`Möchten Sie die Rechnung ${invoice.number} wirklich löschen?`)) {
      try {
        await deleteInvoice.mutateAsync(invoice.id);
      } catch (error) {
        console.error('Failed to delete invoice:', error);
      }
    }
  };

  const { downloadPdf } = useDownloadPdf();

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      await downloadPdf(invoice);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentView === 'detail' && selectedInvoice) {
    return (
      <InvoiceDetail
        invoice={selectedInvoice}
        onBack={handleBackToOverview}
      />
    );
  }

  if (currentView === 'form') {
    return <InvoiceForm invoice={selectedInvoice} onSuccess={handleBackToOverview} />;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamtumsatz</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.total)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Alle Rechnungen</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Euro className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Offene Beträge</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.outstanding)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stats.offen} Rechnungen</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Überfällig</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.overdue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Sofortiges Handeln erforderlich</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monatsumsatz</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.monthlyTotal)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Aktueller Monat</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Rechnungsübersicht</h2>
              <p className="text-sm text-gray-600 mt-1">
                Verwalten Sie Ihre Rechnungen und behalten Sie den Überblick
              </p>
            </div>
            <button 
              onClick={handleNewInvoice}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Neue Rechnung
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
                      transition-all duration-200 flex items-center gap-2
                      ${isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`
                        ml-2 py-0.5 px-2 rounded-full text-xs font-medium
                        ${isActive ? tab.bgColor + ' ' + tab.color : 'bg-gray-100 text-gray-600'}
                      `}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="p-6">
          <InvoiceTable
            invoices={invoices}
            onViewDetails={handleInvoiceClick}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDownloadPdf={handleDownloadPdf}
            activeTab={activeTab}
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceOverview;