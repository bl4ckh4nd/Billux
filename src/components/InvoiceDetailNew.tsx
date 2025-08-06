import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  Mail, 
  MoreVertical, 
  Edit, 
  Trash2, 
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Euro,
  Calendar,
  Building,
  Briefcase,
  Plus,
  Bell,
  CreditCard,
  Send,
  Eye,
  EyeOff,
  Copy,
  Link,
  QrCode,
  XCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { useInvoice } from '../hooks/useInvoice';
import { useInvoicePayments, useInvoicePaymentStats } from '../hooks/useInvoicePayments';
import { useInvoiceReminders, useReminderStats } from '../hooks/useInvoiceReminders';
import { useInvoiceEmailActivities, useEmailStats, useSendInvoiceEmail } from '../hooks/useInvoiceEmailActivities';
import { useDeleteInvoice, useUpdateInvoice } from '../hooks/useInvoices';
import { usePdfGeneration, useDownloadPdf } from '../hooks/usePdf';
import { PDFViewer } from '@react-pdf/renderer';
import { PaymentModal } from './modals/PaymentModal';
import { ReminderModal } from './modals/ReminderModal';
import { DuplicateInvoiceModal } from './modals/DuplicateInvoiceModal';
import { StornoModal } from './modals/StornoModal';
import { CreditNoteModal } from './modals/CreditNoteModal';
import type { Invoice } from '../types/invoice';
import type { ReminderLevel } from '../types/reminder';

interface InvoiceDetailProps {
  invoiceId: string;
  onBack: () => void;
  onCustomerClick?: (customerId: string) => void;
  onProjectClick?: (projectId: string) => void;
  onEditClick?: (invoiceId: string) => void;
}

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ 
  invoiceId, 
  onBack, 
  onCustomerClick,
  onProjectClick,
  onEditClick 
}) => {
  const [activeTab, setActiveTab] = useState('payments');
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showStornoModal, setShowStornoModal] = useState(false);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);

  // Data hooks
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: payments = [] } = useInvoicePayments(invoiceId);
  const { data: paymentStats } = useInvoicePaymentStats(invoiceId);
  const { data: reminders = [] } = useInvoiceReminders(invoiceId);
  const { data: reminderStats } = useReminderStats(invoiceId);
  const { data: emailActivities = [] } = useInvoiceEmailActivities(invoiceId);
  const { data: emailStats } = useEmailStats(invoiceId);
  
  // Mutations
  const deleteInvoice = useDeleteInvoice();
  const updateInvoice = useUpdateInvoice();
  const downloadPdf = useDownloadPdf();
  const sendInvoiceEmail = useSendInvoiceEmail();

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="text-center text-gray-500">Rechnung nicht gefunden</div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (invoice.status === 'Bezahlt') {
      alert('Bezahlte Rechnungen können nicht gelöscht werden.');
      return;
    }
    
    try {
      await deleteInvoice.mutateAsync(invoiceId);
      onBack();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleDownloadPdf = () => {
    downloadPdf.mutate(invoice);
  };

  const getStatusIcon = () => {
    switch (invoice.status) {
      case 'Bezahlt':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Überfällig':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'Teilweise bezahlt':
        return <Clock className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (invoice.status) {
      case 'Bezahlt':
        return 'text-green-600 bg-green-50';
      case 'Überfällig':
        return 'text-red-600 bg-red-50';
      case 'Teilweise bezahlt':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getInvoiceTypeColor = () => {
    switch (invoice.type) {
      case 'Storno':
        return 'bg-red-100 text-red-800';
      case 'Gutschrift':
        return 'bg-green-100 text-green-800';
      case 'Abschlag':
        return 'bg-blue-100 text-blue-800';
      case 'Schlussrechnung':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  Rechnung {invoice.number}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getInvoiceTypeColor()}`}>
                  {invoice.type}
                </span>
              </div>
              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(invoice.date).toLocaleDateString('de-DE')}
                </span>
                {invoice.customerData && (
                  <button
                    onClick={() => onCustomerClick?.(invoice.customerData.id)}
                    className="flex items-center hover:text-teal-600 transition-colors"
                  >
                    <Building className="w-4 h-4 mr-1" />
                    {invoice.customerData.company}
                  </button>
                )}
                {invoice.projectData && (
                  <button
                    onClick={() => onProjectClick?.(invoice.projectData.id)}
                    className="flex items-center hover:text-teal-600 transition-colors"
                  >
                    <Briefcase className="w-4 h-4 mr-1" />
                    {invoice.projectData.title}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={showLivePreview ? "Vorschau ausblenden" : "Vorschau anzeigen"}
            >
              {showLivePreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            <button
              onClick={handleDownloadPdf}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="PDF herunterladen"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="E-Mail senden"
            >
              <Mail className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showActions && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-10">
                  <button
                    onClick={() => {
                      onEditClick?.(invoiceId);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 transition-colors"
                    disabled={invoice.status === 'Bezahlt'}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Bearbeiten
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(invoice.number).then(() => {
                        // You could add a toast notification here
                        console.log('Rechnungsnummer kopiert:', invoice.number);
                      });
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Rechnungsnummer kopieren
                  </button>
                  {invoice.paymentLink && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(invoice.paymentLink!).then(() => {
                          console.log('Zahlungslink kopiert:', invoice.paymentLink);
                        });
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 transition-colors"
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Zahlungslink kopieren
                    </button>
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      setShowDuplicateModal(true);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 transition-colors"
                    disabled={invoice.status === 'Bezahlt'}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Rechnung duplizieren
                  </button>
                  {invoice.type !== 'Storno' && (
                    <button
                      onClick={() => {
                        setShowStornoModal(true);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 text-orange-600 transition-colors"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Storno erstellen
                    </button>
                  )}
                  {invoice.type !== 'Gutschrift' && (
                    <button
                      onClick={() => {
                        setShowCreditNoteModal(true);
                        setShowActions(false);
                      }}
                      className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 text-green-600 transition-colors"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Gutschrift erstellen
                    </button>
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 text-red-600 transition-colors"
                    disabled={invoice.status === 'Bezahlt'}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Löschen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Invoice Details Card */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-teal-600" />
              Rechnungsdetails
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Rechnungsdatum:</span>
                <span className="font-medium">{new Date(invoice.date).toLocaleDateString('de-DE')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fälligkeitsdatum:</span>
                <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString('de-DE')}</span>
              </div>
              {invoice.daysUntilDue !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fälligkeit:</span>
                  <span className={`font-medium ${invoice.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {invoice.isOverdue 
                      ? `${Math.abs(invoice.daysUntilDue)} Tage überfällig`
                      : `In ${invoice.daysUntilDue} Tagen`
                    }
                  </span>
                </div>
              )}
              {invoice.type !== 'Standard' && invoice.projectData && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Projekt:</span>
                    <button
                      onClick={() => onProjectClick?.(invoice.projectData.id)}
                      className="font-medium text-teal-600 hover:text-teal-700"
                    >
                      {invoice.projectData.title}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary Card */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Euro className="w-5 h-5 mr-2 text-teal-600" />
              Finanzen
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gesamtbetrag:</span>
                <span className="font-semibold text-lg">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bezahlt:</span>
                <span className="font-medium text-green-600">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Offen:</span>
                <span className="font-medium text-red-600">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount - invoice.paidAmount)}
                </span>
              </div>
              {paymentStats && paymentStats.paymentProgress > 0 && (
                <div className="pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(paymentStats.paymentProgress, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {Math.round(paymentStats.paymentProgress)}% bezahlt
                  </span>
                </div>
              )}
              {invoice.totalReminderFees && invoice.totalReminderFees > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mahngebühren:</span>
                    <span className="font-medium text-orange-600">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.totalReminderFees)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status & Actions Card */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              {getStatusIcon()}
              <span className="ml-2">Status & Aktionen</span>
            </h3>
            <div className="space-y-3">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                {invoice.status}
              </div>
              
              {reminderStats && reminderStats.lastReminder && (
                <div className="text-sm">
                  <span className="text-gray-600">Letzte Mahnung:</span>
                  <div className="font-medium">
                    {new Date(reminderStats.lastReminder.sentDate).toLocaleDateString('de-DE')}
                    <span className="text-gray-500 ml-1">
                      ({reminderStats.daysSinceLastReminder} Tage her)
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center"
                  disabled={invoice.status === 'Bezahlt'}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Zahlung erfassen
                </button>
                {invoice.status === 'Überfällig' && reminderStats?.nextReminderLevel !== null && (
                  <button 
                    onClick={() => setShowReminderModal(true)}
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Mahnung senden
                  </button>
                )}
                {!invoice.paymentLink && invoice.status !== 'Bezahlt' && (
                  <button 
                    onClick={() => setShowPaymentLinkModal(true)}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Zahlungslink erstellen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b">
          <nav className="flex -mb-px">
            {[
              { id: 'payments', label: 'Zahlungen', icon: CreditCard },
              { id: 'reminders', label: 'Mahnungen', icon: Bell },
              { id: 'emails', label: 'E-Mails', icon: Mail },
              { id: 'documents', label: 'Dokumente', icon: FileText },
              { id: 'activity', label: 'Aktivität', icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${
                    activeTab === tab.id
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'payments' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Zahlungsverlauf</h3>
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center text-teal-600 hover:text-teal-700"
                  disabled={invoice.status === 'Bezahlt'}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Zahlung hinzufügen
                </button>
              </div>
              
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {/* Payment Statistics */}
                  {paymentStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Anzahl Zahlungen</div>
                        <div className="text-xl font-semibold">{paymentStats.paymentCount}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Gesamtsumme</div>
                        <div className="text-xl font-semibold text-green-600">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(paymentStats.totalPaid)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Restsumme</div>
                        <div className="text-xl font-semibold text-red-600">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(paymentStats.remainingAmount)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Ø Zahlungsdauer</div>
                        <div className="text-xl font-semibold">{paymentStats.averagePaymentDays} Tage</div>
                      </div>
                    </div>
                  )}

                  {/* Payments List */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Datum
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Betrag
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Zahlungsart
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Referenz
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(payment.date).toLocaleDateString('de-DE')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(payment.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="flex items-center">
                                {payment.method === 'bank' && <CreditCard className="w-4 h-4 mr-2" />}
                                {payment.method === 'bank' ? 'Überweisung' :
                                 payment.method === 'cash' ? 'Barzahlung' :
                                 payment.method === 'card' ? 'Kartenzahlung' :
                                 payment.method}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.reference || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Noch keine Zahlungen erfasst</p>
                  <button className="mt-4 text-teal-600 hover:text-teal-700 font-medium">
                    Erste Zahlung erfassen
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reminders' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Mahnverlauf</h3>
                {invoice.status === 'Überfällig' && reminderStats?.nextReminderLevel && (
                  <button className="flex items-center text-orange-600 hover:text-orange-700">
                    <Send className="w-4 h-4 mr-1" />
                    {reminderStats.nextReminderLevel === 0 ? 'Zahlungserinnerung' :
                     reminderStats.nextReminderLevel === 1 ? '1. Mahnung' :
                     reminderStats.nextReminderLevel === 2 ? '2. Mahnung' :
                     'Letzte Mahnung'} senden
                  </button>
                )}
              </div>
              
              {reminders.length > 0 ? (
                <div className="space-y-4">
                  {/* Reminder Statistics */}
                  {reminderStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Anzahl Mahnungen</div>
                        <div className="text-xl font-semibold">{reminderStats.totalReminders}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Mahngebühren</div>
                        <div className="text-xl font-semibold text-orange-600">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(reminderStats.totalFees)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Verzugszinsen</div>
                        <div className="text-xl font-semibold text-orange-600">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(reminderStats.totalInterest)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Letzte Mahnung</div>
                        <div className="text-xl font-semibold">
                          {reminderStats.daysSinceLastReminder ? `vor ${reminderStats.daysSinceLastReminder} Tagen` : '-'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reminders Timeline */}
                  <div className="space-y-4">
                    {reminders.map((reminder, index) => (
                      <div key={reminder.id} className="flex space-x-4">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            reminder.level === 0 ? 'bg-blue-100 text-blue-600' :
                            reminder.level === 1 ? 'bg-yellow-100 text-yellow-600' :
                            reminder.level === 2 ? 'bg-orange-100 text-orange-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            <Bell className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="flex-1 bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">
                                {reminder.level === 0 ? 'Zahlungserinnerung' :
                                 reminder.level === 1 ? '1. Mahnung' :
                                 reminder.level === 2 ? '2. Mahnung' :
                                 'Letzte Mahnung'}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Gesendet am {new Date(reminder.sentDate).toLocaleDateString('de-DE')}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Gebühr</div>
                              <div className="font-semibold text-orange-600">
                                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(reminder.reminderFee)}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              Fällig bis: {new Date(reminder.dueDate).toLocaleDateString('de-DE')}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              reminder.status === 'PAID' ? 'bg-green-100 text-green-800' :
                              reminder.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {reminder.status === 'PAID' ? 'Bezahlt' :
                               reminder.status === 'SENT' ? 'Versendet' :
                               'Ausstehend'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Noch keine Mahnungen versendet</p>
                  {invoice.status === 'Überfällig' && (
                    <button className="mt-4 text-orange-600 hover:text-orange-700 font-medium">
                      Erste Zahlungserinnerung senden
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'emails' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">E-Mail-Verlauf</h3>
                <button 
                  onClick={() => setShowEmailModal(true)}
                  className="flex items-center text-teal-600 hover:text-teal-700"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Rechnung senden
                </button>
              </div>
              
              {emailActivities.length > 0 ? (
                <div className="space-y-4">
                  {/* Email Statistics */}
                  {emailStats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">E-Mails gesendet</div>
                        <div className="text-xl font-semibold">{emailStats.totalEmails}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Zugestellt</div>
                        <div className="text-xl font-semibold text-green-600">{emailStats.delivered}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Geöffnet</div>
                        <div className="text-xl font-semibold text-blue-600">{emailStats.opened}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Fehler</div>
                        <div className="text-xl font-semibold text-red-600">{emailStats.failed}</div>
                      </div>
                    </div>
                  )}

                  {/* Email List */}
                  <div className="space-y-3">
                    {emailActivities.map((email) => (
                      <div key={email.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${
                              email.status === 'delivered' ? 'bg-green-100' :
                              email.status === 'failed' ? 'bg-red-100' :
                              email.status === 'sent' ? 'bg-blue-100' :
                              'bg-gray-100'
                            }`}>
                              <Mail className={`w-4 h-4 ${
                                email.status === 'delivered' ? 'text-green-600' :
                                email.status === 'failed' ? 'text-red-600' :
                                email.status === 'sent' ? 'text-blue-600' :
                                'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {email.type === 'invoice_sent' ? 'Rechnung versendet' :
                                 email.type === 'payment_reminder' ? 'Zahlungserinnerung' :
                                 'Zahlungsbestätigung'}
                              </h4>
                              <p className="text-sm text-gray-600">An: {email.recipient}</p>
                              <p className="text-sm text-gray-600">Betreff: {email.subject}</p>
                              {email.errorMessage && (
                                <p className="text-sm text-red-600 mt-1">Fehler: {email.errorMessage}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>{new Date(email.sentAt).toLocaleDateString('de-DE')}</div>
                            <div>{new Date(email.sentAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
                            {email.openedAt && (
                              <div className="text-green-600 mt-1">
                                Geöffnet: {new Date(email.openedAt).toLocaleDateString('de-DE')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Noch keine E-Mails versendet</p>
                  <button 
                    onClick={() => setShowEmailModal(true)}
                    className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Rechnung per E-Mail senden
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Dokumente</h3>
              
              <div className="space-y-4">
                {/* Original Invoice */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Rechnung {invoice.number}</h4>
                        <p className="text-sm text-gray-600">
                          Erstellt am {new Date(invoice.date).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowLivePreview(!showLivePreview)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Vorschau"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleDownloadPdf}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Herunterladen"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reminder Documents */}
                {reminders.map((reminder, index) => (
                  <div key={reminder.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Bell className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            {reminder.level === 0 ? 'Zahlungserinnerung' :
                             reminder.level === 1 ? '1. Mahnung' :
                             reminder.level === 2 ? '2. Mahnung' : 'Letzte Mahnung'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Erstellt am {new Date(reminder.sentDate).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                      <button
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Herunterladen"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* ZUGFeRD XML */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">ZUGFeRD XML</h4>
                        <p className="text-sm text-gray-600">
                          Elektronisches Rechnungsformat
                        </p>
                      </div>
                    </div>
                    <button
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Herunterladen"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Aktivitätsverlauf</h3>
              
              {/* Combined Activity Timeline */}
              <div className="space-y-4">
                {(() => {
                  // Combine all activities into a single timeline
                  const activities: any[] = [];
                  
                  // Add invoice creation
                  activities.push({
                    id: 'created',
                    type: 'invoice_created',
                    date: invoice.date,
                    title: 'Rechnung erstellt',
                    description: `Rechnung ${invoice.number} wurde erstellt`,
                    icon: FileText,
                    color: 'bg-blue-100 text-blue-600'
                  });
                  
                  // Add payments
                  payments.forEach(payment => {
                    activities.push({
                      id: `payment-${payment.id}`,
                      type: 'payment',
                      date: payment.date,
                      title: 'Zahlung erhalten',
                      description: `${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(payment.amount)} per ${
                        payment.method === 'bank' ? 'Überweisung' :
                        payment.method === 'cash' ? 'Barzahlung' : 'Kartenzahlung'
                      }`,
                      icon: CreditCard,
                      color: 'bg-green-100 text-green-600'
                    });
                  });
                  
                  // Add reminders
                  reminders.forEach(reminder => {
                    activities.push({
                      id: `reminder-${reminder.id}`,
                      type: 'reminder',
                      date: reminder.sentDate,
                      title: reminder.level === 0 ? 'Zahlungserinnerung' :
                             reminder.level === 1 ? '1. Mahnung' :
                             reminder.level === 2 ? '2. Mahnung' : 'Letzte Mahnung',
                      description: `Mahnung versendet, Gebühr: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(reminder.reminderFee)}`,
                      icon: Bell,
                      color: 'bg-orange-100 text-orange-600'
                    });
                  });
                  
                  // Add email activities
                  emailActivities.forEach(email => {
                    activities.push({
                      id: `email-${email.id}`,
                      type: 'email',
                      date: email.sentAt,
                      title: email.type === 'invoice_sent' ? 'Rechnung versendet' :
                             email.type === 'payment_reminder' ? 'Zahlungserinnerung' :
                             'Zahlungsbestätigung',
                      description: `E-Mail an ${email.recipient}`,
                      icon: Mail,
                      color: 'bg-purple-100 text-purple-600'
                    });
                  });
                  
                  // Sort by date descending
                  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  
                  return activities.length > 0 ? activities.map((activity, index) => (
                    <div key={activity.id} className="flex space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color}`}>
                          <activity.icon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{activity.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(activity.date).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                        </div>
                        {index < activities.length - 1 && (
                          <div className="ml-5 h-8 border-l-2 border-gray-200"></div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Keine Aktivitäten vorhanden</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Rechnung löschen</h3>
            <p className="mb-6">
              Sind Sie sicher, dass Sie die Rechnung {invoice.number} löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Panel */}
      {showLivePreview && (
        <div className="fixed right-0 top-0 h-full w-1/2 bg-white shadow-2xl z-40 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">PDF Vorschau</h3>
            <button
              onClick={() => setShowLivePreview(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
          <div className="h-full pb-16">
            <InvoiceLivePreview invoice={invoice} />
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal 
          invoice={invoice} 
          onClose={() => setShowPaymentModal(false)} 
        />
      )}

      {/* Reminder Modal */}
      {showReminderModal && reminderStats && reminderStats.nextReminderLevel !== null && (
        <ReminderModal 
          invoice={invoice}
          reminderLevel={reminderStats.nextReminderLevel as ReminderLevel}
          onClose={() => setShowReminderModal(false)}
        />
      )}

      {/* Payment Link Modal */}
      {showPaymentLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Zahlungslink erstellen</h3>
              <button 
                onClick={() => setShowPaymentLinkModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Ein Zahlungslink ermöglicht es Ihrem Kunden, die Rechnung online zu bezahlen.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Verfügbare Zahlungsmethoden:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Kreditkarte (Visa, Mastercard)</li>
                  <li>• PayPal</li>
                  <li>• SEPA Lastschrift</li>
                  <li>• Sofortüberweisung</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <QrCode className="w-5 h-5 text-blue-600 mt-0.5 mr-2" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">QR-Code verfügbar</p>
                    <p className="text-blue-700">Der Link kann auch als QR-Code auf der Rechnung gedruckt werden.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentLinkModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  // TODO: Implement payment link generation
                  alert('Zahlungslink-Generierung wird implementiert...');
                  setShowPaymentLinkModal(false);
                }}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Link erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Invoice Modal */}
      {showDuplicateModal && (
        <DuplicateInvoiceModal
          invoice={invoice}
          onClose={() => setShowDuplicateModal(false)}
          onSuccess={(newInvoiceId) => {
            // Optionally navigate to the new invoice
            onEditClick?.(newInvoiceId);
          }}
        />
      )}

      {/* Storno Modal */}
      {showStornoModal && (
        <StornoModal
          invoice={invoice}
          onClose={() => setShowStornoModal(false)}
          onSuccess={(newInvoiceId) => {
            // Optionally navigate to the new storno invoice
            onEditClick?.(newInvoiceId);
          }}
        />
      )}

      {/* Credit Note Modal */}
      {showCreditNoteModal && (
        <CreditNoteModal
          invoice={invoice}
          onClose={() => setShowCreditNoteModal(false)}
          onSuccess={(newInvoiceId) => {
            // Optionally navigate to the new credit note
            onEditClick?.(newInvoiceId);
          }}
        />
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Rechnung per E-Mail senden</h3>
                <button 
                  onClick={() => setShowEmailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empfänger</label>
                <input
                  type="email"
                  defaultValue={invoice.customerData?.email}
                  className="w-full rounded-lg border-gray-300"
                  placeholder="kunde@beispiel.de"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Betreff</label>
                <input
                  type="text"
                  defaultValue={`Rechnung ${invoice.number}`}
                  className="w-full rounded-lg border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nachricht</label>
                <textarea
                  rows={6}
                  className="w-full rounded-lg border-gray-300"
                  defaultValue={`Sehr geehrte Damen und Herren,

anbei erhalten Sie die Rechnung ${invoice.number} über ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}.

Bitte überweisen Sie den Betrag bis zum ${new Date(invoice.dueDate).toLocaleDateString('de-DE')} auf unser Konto.

Mit freundlichen Grüßen`}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Anhänge:</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded text-teal-600" />
                    <span className="ml-2 text-sm">Rechnung als PDF</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded text-teal-600" />
                    <span className="ml-2 text-sm">ZUGFeRD XML</span>
                  </label>
                  {invoice.paymentLink && (
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="rounded text-teal-600" />
                      <span className="ml-2 text-sm">Zahlungslink einbinden</span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-6">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    // Get form values
                    const form = document.querySelector('form') as HTMLFormElement;
                    const recipient = (form.querySelector('input[type="email"]') as HTMLInputElement)?.value;
                    const subject = (form.querySelectorAll('input[type="text"]')[0] as HTMLInputElement)?.value;
                    const message = (form.querySelector('textarea') as HTMLTextAreaElement)?.value;
                    
                    if (recipient && subject) {
                      sendInvoiceEmail.mutate({
                        invoiceId: invoice.id,
                        recipient,
                        subject,
                        message
                      }, {
                        onSuccess: () => {
                          setShowEmailModal(false);
                        }
                      });
                    }
                  }}
                  disabled={sendInvoiceEmail.isLoading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendInvoiceEmail.isLoading ? 'Sende...' : 'E-Mail senden'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Live Preview Component
const InvoiceLivePreview: React.FC<{ invoice: Invoice }> = ({ invoice }) => {
  const { data: pdfData, isLoading } = usePdfGeneration(invoice);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">PDF wird generiert...</div>
      </div>
    );
  }

  if (!pdfData || !pdfData.component) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">PDF konnte nicht generiert werden</div>
      </div>
    );
  }

  return (
    <PDFViewer width="100%" height="100%" showToolbar={false}>
      <pdfData.component />
    </PDFViewer>
  );
};

export default InvoiceDetail;