import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Copy, Calendar, Briefcase } from 'lucide-react';
import { useDuplicateInvoice } from '../../hooks/useDuplicateInvoice';
import { useProjects } from '../../hooks/useProjects';
import type { Invoice } from '../../types/invoice';

interface DuplicateInvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess?: (newInvoiceId: string) => void;
}

interface DuplicateFormData {
  date: string;
  dueDate: string;
  projectId: string;
}

export const DuplicateInvoiceModal: React.FC<DuplicateInvoiceModalProps> = ({ 
  invoice, 
  onClose,
  onSuccess 
}) => {
  const duplicateInvoice = useDuplicateInvoice();
  const { data: projects } = useProjects();
  
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 30);

  const { register, handleSubmit, formState: { errors } } = useForm<DuplicateFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      dueDate: defaultDueDate.toISOString().split('T')[0],
      projectId: invoice.projectId || ''
    }
  });

  const onSubmit = (data: DuplicateFormData) => {
    duplicateInvoice.mutate({
      invoiceId: invoice.id,
      data: {
        date: data.date,
        dueDate: data.dueDate,
        projectId: data.projectId || undefined
      }
    }, {
      onSuccess: (newInvoice) => {
        onSuccess?.(newInvoice.id);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Rechnung duplizieren
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Copy className="w-5 h-5 mr-2 text-teal-600" />
              <h3 className="font-semibold">Original-Rechnung</h3>
            </div>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-gray-600">Nummer:</span>
                <span className="ml-2 font-medium">{invoice.number}</span>
              </div>
              <div>
                <span className="text-gray-600">Kunde:</span>
                <span className="ml-2 font-medium">{invoice.customerData?.company || invoice.customer}</span>
              </div>
              <div>
                <span className="text-gray-600">Betrag:</span>
                <span className="ml-2 font-medium">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Rechnungsdatum
              </label>
              <input
                type="date"
                {...register('date', { required: 'Rechnungsdatum ist erforderlich' })}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
              {errors.date && <span className="text-sm text-red-600 mt-1">{errors.date.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fälligkeitsdatum
              </label>
              <input
                type="date"
                {...register('dueDate', { required: 'Fälligkeitsdatum ist erforderlich' })}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              />
              {errors.dueDate && <span className="text-sm text-red-600 mt-1">{errors.dueDate.message}</span>}
            </div>

            {projects && projects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Briefcase className="w-4 h-4 inline mr-1" />
                  Projekt (optional)
                </label>
                <select
                  {...register('projectId')}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                >
                  <option value="">Kein Projekt</option>
                  {projects
                    .filter(p => p.customerId === invoice.customerId)
                    .map(project => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              Eine neue Rechnung wird mit einer neuen Nummer erstellt. 
              Alle Positionen und Details werden übernommen, aber der Zahlungsstatus wird zurückgesetzt.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={duplicateInvoice.isLoading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {duplicateInvoice.isLoading ? 'Erstelle...' : 'Rechnung duplizieren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};