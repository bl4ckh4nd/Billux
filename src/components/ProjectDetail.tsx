import React, { useState } from 'react';
import { ArrowLeft, MoreVertical, Edit, Trash2, Plus, FileText, Euro, Calendar, Briefcase, Clock, CheckCircle, AlertCircle, TrendingUp, type LucideIcon } from 'lucide-react';
import { useProject } from '../hooks/useProjects';
import { useDeleteProject } from '../hooks/useProjects';
import { useProjectInvoices } from '../hooks/useProjectInvoices';
import { useCustomer } from '../hooks/useCustomers';
import ProjectForm from './ProjectForm';
import type { ProjectStatus } from '../types/project';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  onCustomerClick?: (customerId: string) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ projectId, onBack, onCustomerClick }) => {
  const { data: project, isLoading } = useProject(projectId);
  const { data: customer } = useCustomer(project?.customerId || '');
  const { data: invoices = [] } = useProjectInvoices(project?.id);
  const deleteProject = useDeleteProject();
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoices' | 'tasks' | 'documents' | 'activity'>('invoices');

  const handleEdit = () => {
    setShowEditForm(true);
    setShowActions(false);
  };

  const handleDelete = async () => {
    if (!project) return;
    
    try {
      await deleteProject.mutateAsync(project.id);
      onBack();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Fehler beim Löschen des Projekts');
    }
  };

  const handleUpdateSuccess = () => {
    setShowEditForm(false);
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'planned': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ProjectStatus) => {
    switch (status) {
      case 'planned': return 'Geplant';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Projekt nicht gefunden</p>
          <button onClick={onBack} className="mt-4 text-emerald-600 hover:text-emerald-700">
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  if (showEditForm) {
    return <ProjectForm project={project} onClose={() => setShowEditForm(false)} />;
  }

  // Calculate progress
  const progress = project.progressPercentage || 0;
  const budgetUtilization = project.totalInvoiced ? (project.totalInvoiced / project.budget) * 100 : 0;

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
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusText(project.status)}
                </span>
                {customer && (
                  <button
                    onClick={() => onCustomerClick && onCustomerClick(customer.id)}
                    className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
                  >
                    {customer.company}
                  </button>
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

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Project Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-emerald-600" />
            Projektinformationen
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Beschreibung</p>
              <p className="text-gray-900">{project.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Startdatum
                </p>
                <p className="text-gray-900">{new Date(project.startDate).toLocaleDateString('de-DE')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Enddatum
                </p>
                <p className="text-gray-900">{new Date(project.endDate).toLocaleDateString('de-DE')}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fortschritt</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Zeitfortschritt</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="mt-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
            {project.isOverdue && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                Projekt ist überfällig
              </div>
            )}
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
              <p className="text-sm text-gray-500">Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(project.budget)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500">Abgerechnet</p>
                <p className="text-sm font-medium text-emerald-600">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(project.totalInvoiced || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Bezahlt</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(project.totalPaid || 0)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Offener Betrag</p>
              <p className="text-sm font-medium text-orange-600">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(project.outstandingBalance || 0)}
              </p>
            </div>
            <div className="pt-2">
              <p className="text-xs text-gray-500">Budgetauslastung</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      budgetUtilization > 100 ? 'bg-red-600' : 
                      budgetUtilization > 80 ? 'bg-orange-600' : 
                      'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, budgetUtilization)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">{Math.round(budgetUtilization)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-emerald-600" />
            Zeitplan
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Projektdauer</p>
              <p className="text-xl font-semibold text-gray-900">
                {Math.round((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} Tage
              </p>
            </div>
            {project.status === 'in_progress' && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Verbleibende Tage</p>
                  <p className={`text-xl font-semibold ${project.daysRemaining && project.daysRemaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {project.daysRemaining || 0} Tage
                  </p>
                </div>
                {project.daysRemaining && project.daysRemaining <= 7 && project.daysRemaining > 0 && (
                  <div className="flex items-center text-orange-600 text-sm">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Projekt endet bald
                  </div>
                )}
              </>
            )}
            {project.status === 'completed' && (
              <div className="flex items-center text-emerald-600 text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Projekt abgeschlossen
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {(['invoices', 'tasks', 'documents', 'activity'] as const).map((tab) => (
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
                {tab === 'tasks' && 'Aufgaben'}
                {tab === 'documents' && 'Dokumente'}
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
                      <p className="text-sm text-gray-500">Anzahl Rechnungen</p>
                      <p className="text-xl font-semibold text-gray-900">{invoices.length}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Gesamt</p>
                      <p className="text-xl font-semibold text-emerald-600">
                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                          invoices.reduce((sum, inv) => sum + inv.amount, 0)
                        )}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Bezahlt</p>
                      <p className="text-xl font-semibold text-blue-600">
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
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nummer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Typ</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {invoice.type}
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
          
          {activeTab === 'tasks' && (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Aufgabenverwaltung wird implementiert...</p>
              <button className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                <Plus className="h-5 w-5 mr-2" />
                Neue Aufgabe
              </button>
            </div>
          )}
          
          {activeTab === 'documents' && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Dokumentenverwaltung wird implementiert...</p>
              <button className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                <Plus className="h-5 w-5 mr-2" />
                Dokument hochladen
              </button>
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div>
              {/* Create a combined activity timeline */}
              {(() => {
                const activities: Array<{
                  id: string;
                  type: 'status' | 'invoice' | 'created';
                  date: string;
                  title: string;
                  description: string;
                  icon: LucideIcon;
                  color: string;
                }> = [];

                // Add project creation
                if (project.createdAt) {
                  activities.push({
                    id: `created-${project.id}`,
                    type: 'created',
                    date: project.createdAt,
                    title: 'Projekt erstellt',
                    description: `Projekt "${project.title}" wurde angelegt`,
                    icon: Plus,
                    color: 'text-gray-600'
                  });
                }

                // Add status change to in_progress
                if (project.status === 'in_progress' || project.status === 'completed') {
                  activities.push({
                    id: `status-progress-${project.id}`,
                    type: 'status',
                    date: project.startDate,
                    title: 'Projekt gestartet',
                    description: 'Status geändert zu "In Bearbeitung"',
                    icon: Clock,
                    color: 'text-blue-600'
                  });
                }

                // Add invoices
                invoices.forEach(invoice => {
                  activities.push({
                    id: `inv-${invoice.id}`,
                    type: 'invoice',
                    date: invoice.date,
                    title: `Rechnung ${invoice.number}`,
                    description: `${invoice.type} über ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}`,
                    icon: FileText,
                    color: 'text-emerald-600'
                  });
                });

                // Add completion status
                if (project.status === 'completed' && project.updatedAt) {
                  activities.push({
                    id: `status-complete-${project.id}`,
                    type: 'status',
                    date: project.updatedAt,
                    title: 'Projekt abgeschlossen',
                    description: 'Projekt wurde erfolgreich abgeschlossen',
                    icon: CheckCircle,
                    color: 'text-emerald-600'
                  });
                }

                // Sort by date descending
                activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                return activities.length > 0 ? (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {activities.map((activity, idx) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {idx !== activities.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                  activity.type === 'invoice' ? 'bg-emerald-500' :
                                  activity.type === 'status' ? 'bg-blue-500' :
                                  'bg-gray-500'
                                }`}>
                                  <activity.icon className="h-5 w-5 text-white" aria-hidden="true" />
                                </span>
                              </div>
                              <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                <div>
                                  <p className="text-sm text-gray-900">{activity.title}</p>
                                  <p className="text-sm text-gray-500">{activity.description}</p>
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
            <h3 className="text-lg font-semibold mb-4">Projekt löschen</h3>
            <p className="mb-6">
              Sind Sie sicher, dass Sie das Projekt <strong>{project.title}</strong> löschen möchten? 
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

export default ProjectDetail;