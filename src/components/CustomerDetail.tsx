import React, { useState } from 'react';
import { ArrowLeft, MoreVertical, Edit, Trash2, Plus, FileText, Euro, Calendar, Building2, User, Phone, Mail, MapPin, TrendingUp, CheckCircle, type LucideIcon } from 'lucide-react';
import { useCustomer } from '../hooks/useCustomers';
import { useDeleteCustomer } from '../hooks/useCustomers';
import { useCustomerProjects } from '../hooks/useProjects';
import { useCustomerInvoices } from '../hooks/useCustomerInvoices';
import { useCustomerPayments } from '../hooks/useCustomerPayments';
import CustomerForm from './CustomerForm';

interface CustomerDetailProps {
  customerId: string;
  onBack: () => void;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customerId, onBack }) => {
  const { data: customer, isLoading } = useCustomer(customerId);
  const { data: projects = [] } = useCustomerProjects(customerId);
  const { data: invoices = [] } = useCustomerInvoices(customer?.company);
  const { data: payments = [] } = useCustomerPayments(customer?.company);
  const deleteCustomer = useDeleteCustomer();
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [activeTab, setActiveTab] = useState<'projects' | 'invoices' | 'payments' | 'activity'>('invoices');

  const handleEdit = () => {
    setShowEditForm(true);
    setShowActions(false);
  };

  const handleDelete = async () => {
    if (!customer) return;
    
    try {
      await deleteCustomer.mutateAsync(customer.id);
      onBack();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Fehler beim Löschen des Kunden');
    }
  };

  const handleUpdateSuccess = () => {
    setShowEditForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Kunde nicht gefunden</p>
          <button onClick={onBack} className="mt-4 text-emerald-600 hover:text-emerald-700">
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  if (showEditForm) {
    return <CustomerForm customer={customer} onClose={handleUpdateSuccess} />;
  }

  // Determine if customer is active (had invoice in last 6 months)
  const isActive = customer.lastInvoiceDate && 
    new Date(customer.lastInvoiceDate) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.company}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
                {customer.taxId && (
                  <span className="text-sm text-gray-500">USt-IdNr.: {customer.taxId}</span>
                )}
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                <button
                  onClick={handleEdit}
                  className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2 text-gray-500" />
                  Bearbeiten
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(true);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Löschen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-emerald-600" />
            Kontaktinformationen
          </h3>
          <div className="space-y-3">
            {customer.contactPerson && (
              <div>
                <p className="text-sm text-gray-500">Ansprechpartner</p>
                <p className="text-gray-900 font-medium">{customer.contactPerson}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 flex items-center">
                <Mail className="w-4 h-4 mr-1" />
                E-Mail
              </p>
              <a href={`mailto:${customer.email}`} className="text-emerald-600 hover:text-emerald-700">
                {customer.email}
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                Telefon
              </p>
              <a href={`tel:${customer.phone}`} className="text-emerald-600 hover:text-emerald-700">
                {customer.phone}
              </a>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                Adresse
              </p>
              <p className="text-gray-900">
                {customer.street}<br />
                {customer.postalCode} {customer.city}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Summary Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Euro className="w-5 h-5 mr-2 text-emerald-600" />
            Finanzen
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Gesamtumsatz</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(customer.totalRevenue)}
              </p>
            </div>
            {customer.outstandingBalance !== undefined && (
              <div>
                <p className="text-sm text-gray-500">Offene Beträge</p>
                <p className="text-xl font-semibold text-orange-600">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(customer.outstandingBalance)}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div>
                <p className="text-xs text-gray-500">Rechnungen</p>
                <p className="text-sm font-medium text-gray-900">{customer.totalInvoices || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ø Rechnungswert</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(customer.averageInvoiceValue || 0)}
                </p>
              </div>
            </div>
            {customer.onTimePaymentRate !== undefined && (
              <div className="pt-2">
                <p className="text-xs text-gray-500">Pünktliche Zahlungen</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${customer.onTimePaymentRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{Math.round(customer.onTimePaymentRate)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Project Overview Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
            Projekte
          </h3>
          <div className="space-y-3">
            {projects.length > 0 ? (
              <>
                <div>
                  <p className="text-sm text-gray-500">Aktive Projekte</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {projects.filter(p => p.status === 'in_progress').length}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <p className="text-xs text-gray-500">Gesamt</p>
                    <p className="text-sm font-medium text-gray-900">{projects.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Abgeschlossen</p>
                    <p className="text-sm font-medium text-emerald-600">
                      {projects.filter(p => p.status === 'completed').length}
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-gray-500">Gesamtvolumen</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                      projects.reduce((sum, p) => sum + (p.budget || 0), 0)
                    )}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Keine Projekte vorhanden</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {(['invoices', 'projects', 'payments', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'invoices' && 'Rechnungen'}
                {tab === 'projects' && 'Projekte'}
                {tab === 'payments' && 'Zahlungen'}
                {tab === 'activity' && 'Aktivitäten'}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'invoices' && (
            <div>
              {invoices.length > 0 ? (
                <div>
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Gesamt</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                          invoices.reduce((sum, inv) => sum + inv.amount, 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Bezahlt</p>
                      <p className="text-xl font-semibold text-emerald-600">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                          invoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Offen</p>
                      <p className="text-xl font-semibold text-orange-600">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                          invoices.reduce((sum, inv) => sum + (inv.amount - inv.paidAmount), 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Überfällig</p>
                      <p className="text-xl font-semibold text-red-600">
                        {invoices.filter(inv => inv.status === 'Überfällig').length}
                      </p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nummer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projekt</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {invoice.number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(invoice.date).toLocaleDateString('de-DE')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                invoice.status === 'Bezahlt' ? 'bg-emerald-100 text-emerald-800' :
                                invoice.status === 'Überfällig' ? 'bg-red-100 text-red-800' :
                                invoice.status === 'Teilweise bezahlt' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {invoice.projectId ? projects.find(p => p.id === invoice.projectId)?.title || '-' : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Keine Rechnungen vorhanden</p>
                  <button className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    <Plus className="h-5 w-5 mr-2" />
                    Neue Rechnung
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'projects' && (
            <div>
              {projects.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titel</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Startdatum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enddatum</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rechnungen</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{project.title}</div>
                              {project.description && (
                                <div className="text-sm text-gray-500">{project.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              project.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              project.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {project.status === 'completed' ? 'Abgeschlossen' :
                               project.status === 'in_progress' ? 'In Bearbeitung' :
                               project.status === 'cancelled' ? 'Abgebrochen' : 'Geplant'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {project.startDate ? new Date(project.startDate).toLocaleDateString('de-DE') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {project.endDate ? new Date(project.endDate).toLocaleDateString('de-DE') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(project.budget || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {project.invoices?.length || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Keine Projekte vorhanden</p>
                  <button className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    <Plus className="h-5 w-5 mr-2" />
                    Neues Projekt
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'payments' && (
            <div>
              {payments.length > 0 ? (
                <div>
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Gesamtzahlungen</p>
                      <p className="text-xl font-semibold text-emerald-600">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                          payments.reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Anzahl Zahlungen</p>
                      <p className="text-xl font-semibold text-blue-600">{payments.length}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Ø Zahlungsbetrag</p>
                      <p className="text-xl font-semibold text-purple-600">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                          payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zahlungsart</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referenz</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rechnung</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => {
                          const invoice = invoices.find(inv => inv.payments?.some(p => p.id === payment.id));
                          return (
                            <tr key={payment.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(payment.date).toLocaleDateString('de-DE')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(payment.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className="inline-flex items-center">
                                  {payment.method === 'bank' && <><Euro className="h-4 w-4 mr-1" /> Überweisung</>}
                                  {payment.method === 'cash' && <><Euro className="h-4 w-4 mr-1" /> Barzahlung</>}
                                  {payment.method === 'card' && <><Euro className="h-4 w-4 mr-1" /> Kartenzahlung</>}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {payment.reference || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {invoice ? invoice.number : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Euro className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Keine Zahlungen vorhanden</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div>
              {/* Create a combined activity timeline */}
              {(() => {
                const activities: Array<{
                  id: string;
                  type: 'invoice' | 'payment' | 'project';
                  date: string;
                  title: string;
                  description: string;
                  amount?: number;
                  icon: LucideIcon;
                  color: string;
                }> = [];

                // Add invoice activities
                invoices.forEach(invoice => {
                  activities.push({
                    id: `inv-${invoice.id}`,
                    type: 'invoice',
                    date: invoice.date,
                    title: `Rechnung ${invoice.number}`,
                    description: `Rechnung erstellt`,
                    amount: invoice.amount,
                    icon: FileText,
                    color: 'text-blue-600'
                  });
                });

                // Add payment activities
                payments.forEach(payment => {
                  const invoice = invoices.find(inv => inv.payments?.some(p => p.id === payment.id));
                  activities.push({
                    id: `pay-${payment.id}`,
                    type: 'payment',
                    date: payment.date,
                    title: 'Zahlung erhalten',
                    description: invoice ? `für Rechnung ${invoice.number}` : 'Zahlung',
                    amount: payment.amount,
                    icon: Euro,
                    color: 'text-emerald-600'
                  });
                });

                // Add project activities
                projects.forEach(project => {
                  if (project.startDate) {
                    activities.push({
                      id: `proj-start-${project.id}`,
                      type: 'project',
                      date: project.startDate,
                      title: project.title,
                      description: 'Projekt gestartet',
                      icon: TrendingUp,
                      color: 'text-purple-600'
                    });
                  }
                  if (project.endDate && project.status === 'completed') {
                    activities.push({
                      id: `proj-end-${project.id}`,
                      type: 'project',
                      date: project.endDate,
                      title: project.title,
                      description: 'Projekt abgeschlossen',
                      icon: CheckCircle,
                      color: 'text-emerald-600'
                    });
                  }
                });

                // Sort by date descending
                activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                return activities.length > 0 ? (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {activities.slice(0, 20).map((activity, idx) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {idx !== activities.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                  activity.type === 'payment' ? 'bg-emerald-500' :
                                  activity.type === 'invoice' ? 'bg-blue-500' :
                                  'bg-purple-500'
                                }`}>
                                  <activity.icon className="h-5 w-5 text-white" aria-hidden="true" />
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-900">{activity.title}</p>
                                  <p className="text-sm text-gray-500">{activity.description}</p>
                                  {activity.amount && (
                                    <p className="text-sm font-medium text-gray-900 mt-1">
                                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(activity.amount)}
                                    </p>
                                  )}
                                </div>
                                <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                  <time dateTime={activity.date}>
                                    {new Date(activity.date).toLocaleDateString('de-DE')}
                                  </time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Keine Aktivitäten vorhanden</p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Kunde löschen</h3>
            <p className="mb-6">
              Sind Sie sicher, dass Sie den Kunden <strong>{customer.company}</strong> löschen möchten? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetail;