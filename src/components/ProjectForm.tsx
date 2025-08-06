import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Briefcase, Calendar, Euro, Settings, AlertTriangle } from 'lucide-react';
import { useCreateProject, useUpdateProject } from '../hooks/useProjects';
import { useCustomers } from '../hooks/useCustomers';
import type { Project, CreateProjectDTO, ProjectStatus } from '../types/project';

interface ProjectFormProps {
  project?: Project | null;
  onClose: () => void;
}

interface ProjectFormData {
  title: string;
  description: string;
  customerId: string;
  startDate: string;
  endDate: string;
  budget: number;
  status: ProjectStatus;
  notes: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  costCenter: string;
  billingModel: 'complete' | 'partial';
  plannedPartialInvoices: number;
}

const projectCategories = [
  'Neubau',
  'Renovierung',
  'Sanierung',
  'Wartung',
  'Beratung',
  'Sonderprojekt',
  'Sonstiges'
];

const priorityOptions = [
  { value: 'low', label: 'Niedrig', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Mittel', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'Hoch', color: 'bg-red-100 text-red-800' }
];

const statusOptions = [
  { value: 'planned', label: 'Geplant', color: 'bg-blue-100 text-blue-800' },
  { value: 'in_progress', label: 'In Bearbeitung', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'completed', label: 'Abgeschlossen', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Abgebrochen', color: 'bg-red-100 text-red-800' }
];

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onClose }) => {
  const isEditMode = !!project;
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ProjectFormData>({
    defaultValues: isEditMode ? {
      title: project.title,
      description: project.description,
      customerId: project.customerId,
      startDate: project.startDate?.split('T')[0] || project.startDate,
      endDate: project.endDate?.split('T')[0] || project.endDate,
      budget: project.budget,
      status: project.status,
      notes: project.notes || '',
      priority: 'medium',
      category: 'Sonstiges',
      costCenter: '',
      billingModel: 'complete',
      plannedPartialInvoices: 1
    } : {
      priority: 'medium',
      category: 'Sonstiges',
      costCenter: '',
      billingModel: 'complete',
      plannedPartialInvoices: 1,
      status: 'planned',
      notes: ''
    }
  });
  
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const { data: customers } = useCustomers();

  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');
  const watchedBillingModel = watch('billingModel');

  const onSubmit = (data: ProjectFormData) => {
    const projectData = {
      title: data.title,
      description: data.description,
      customerId: data.customerId,
      startDate: data.startDate,
      endDate: data.endDate,
      budget: data.budget,
      ...(isEditMode && { status: data.status }),
      notes: data.notes
    };

    if (isEditMode && project) {
      updateProject.mutate({
        id: project.id,
        data: {
          ...projectData,
          updatedAt: new Date().toISOString()
        }
      }, {
        onSuccess: () => onClose()
      });
    } else {
      createProject.mutate({
        ...projectData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as CreateProjectDTO, {
        onSuccess: () => onClose()
      });
    }
  };

  // Calculate project duration
  const calculateDuration = () => {
    if (watchedStartDate && watchedEndDate) {
      const start = new Date(watchedStartDate);
      const end = new Date(watchedEndDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return 0;
  };

  const duration = calculateDuration();
  const isDateRangeValid = watchedStartDate && watchedEndDate && new Date(watchedStartDate) <= new Date(watchedEndDate);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? `Projekt bearbeiten: ${project.title}` : 'Neues Projekt erstellen'}
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {/* Project Details Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <Briefcase className="w-5 h-5 mr-2 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">Projektdetails</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Projekttitel *</label>
                <input
                  {...register('title', { required: 'Projekttitel ist erforderlich' })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="z.B. Renovierung Bürogebäude"
                />
                {errors.title && <span className="text-sm text-red-600 mt-1">{errors.title.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kunde *</label>
                <select
                  {...register('customerId', { required: 'Kunde ist erforderlich' })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value="">Kunde auswählen</option>
                  {customers?.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
                {errors.customerId && <span className="text-sm text-red-600 mt-1">{errors.customerId.message}</span>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Projektbeschreibung *</label>
                <textarea
                  {...register('description', { required: 'Beschreibung ist erforderlich' })}
                  rows={3}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="Detaillierte Beschreibung des Projekts..."
                />
                {errors.description && <span className="text-sm text-red-600 mt-1">{errors.description.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
                <select
                  {...register('category')}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                  {projectCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorität</label>
                <select
                  {...register('priority')}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Timeline & Status Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">Zeitplan & Status</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Startdatum *</label>
                <input
                  type="date"
                  {...register('startDate', { required: 'Startdatum ist erforderlich' })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
                {errors.startDate && <span className="text-sm text-red-600 mt-1">{errors.startDate.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enddatum *</label>
                <input
                  type="date"
                  {...register('endDate', { 
                    required: 'Enddatum ist erforderlich',
                    validate: (value) => {
                      if (watchedStartDate && value && new Date(value) < new Date(watchedStartDate)) {
                        return 'Enddatum muss nach dem Startdatum liegen';
                      }
                      return true;
                    }
                  })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
                {errors.endDate && <span className="text-sm text-red-600 mt-1">{errors.endDate.message}</span>}
              </div>

              {isEditMode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    {...register('status')}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {duration > 0 && isDateRangeValid && (
                <div className="flex items-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-sm text-emerald-800">
                    <strong>Projektdauer:</strong> {duration} Tage
                  </div>
                </div>
              )}

              {!isDateRangeValid && watchedStartDate && watchedEndDate && (
                <div className="flex items-center p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                  <div className="text-sm text-red-800">
                    Ungültiger Datumsbereich
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Planning Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <Euro className="w-5 h-5 mr-2 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">Finanzplanung</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gesamtbudget * (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('budget', { 
                    required: 'Budget ist erforderlich',
                    min: { value: 0, message: 'Budget muss positiv sein' },
                    valueAsNumber: true
                  })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="0.00"
                />
                {errors.budget && <span className="text-sm text-red-600 mt-1">{errors.budget.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kostenstelle</label>
                <input
                  {...register('costCenter')}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  placeholder="z.B. 4711-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Abrechnungsmodell</label>
                <select
                  {...register('billingModel')}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                >
                  <option value="complete">Komplettabrechnung</option>
                  <option value="partial">Abschlagsrechnungen</option>
                </select>
              </div>

              {watchedBillingModel === 'partial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anzahl geplanter Abschläge</label>
                  <input
                    type="number"
                    min="1"
                    {...register('plannedPartialInvoices', { 
                      min: { value: 1, message: 'Mindestens 1 Abschlag erforderlich' },
                      valueAsNumber: true
                    })}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  {errors.plannedPartialInvoices && <span className="text-sm text-red-600 mt-1">{errors.plannedPartialInvoices.message}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 mr-2 text-emerald-600" />
              <h3 className="text-lg font-semibold text-gray-900">Zusätzliche Informationen</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Projektnotizen</label>
              <textarea
                {...register('notes')}
                rows={4}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                placeholder="Zusätzliche Hinweise, interne Vermerke, besondere Anforderungen..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={createProject.isLoading || updateProject.isLoading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {createProject.isLoading || updateProject.isLoading ? 'Speichere...' : 
               isEditMode ? 'Änderungen speichern' : 'Projekt erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;
