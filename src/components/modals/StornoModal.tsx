import React from 'react';
import { useForm } from 'react-hook-form';
import { X, XCircle, AlertTriangle } from 'lucide-react';
import { useCreateStorno } from '../../hooks/useCreateStorno';
import type { Invoice } from '../../types/invoice';

interface StornoModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess?: (newInvoiceId: string) => void;
}

interface StornoFormData {
  reason: string;
  confirm: boolean;
}

const stornoReasons = [
  'Fehlerhafte Rechnung',
  'Leistung nicht erbracht',
  'Kunde hat storniert',
  'Doppelte Rechnung',
  'Falscher Kunde',
  'Falscher Betrag',
  'Sonstiges'
];

export const StornoModal: React.FC<StornoModalProps> = ({ 
  invoice, 
  onClose,
  onSuccess 
}) => {
  const createStorno = useCreateStorno();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<StornoFormData>({
    defaultValues: {
      reason: '',
      confirm: false
    }
  });

  const watchConfirm = watch('confirm');

  const onSubmit = (data: StornoFormData) => {
    createStorno.mutate({
      invoiceId: invoice.id,
      reason: data.reason
    }, {
      onSuccess: (newStorno) => {
        onSuccess?.(newStorno.id);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Storno erstellen
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900">Wichtiger Hinweis</h4>
                <p className="text-sm text-red-700 mt-1">
                  Ein Storno kann nicht rückgängig gemacht werden. Die Originalrechnung wird durch eine 
                  Stornorechnung mit negativem Betrag ausgeglichen.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <XCircle className="w-5 h-5 mr-2 text-orange-600" />
              <h3 className="font-semibold">Zu stornierende Rechnung</h3>
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
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium">{invoice.status}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stornogrund *
            </label>
            <select
              {...register('reason', { required: 'Stornogrund ist erforderlich' })}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            >
              <option value="">Bitte wählen...</option>
              {stornoReasons.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
            {errors.reason && <span className="text-sm text-red-600 mt-1">{errors.reason.message}</span>}
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Hinweis:</strong> Es wird eine neue Stornorechnung mit der Nummer 
              <span className="font-mono mx-1">{new Date().getFullYear()}-XXXX-S</span>
              erstellt. Der Betrag der Stornorechnung entspricht dem negativen Betrag der Originalrechnung.
            </p>
          </div>

          <div>
            <label className="flex items-start">
              <input
                type="checkbox"
                {...register('confirm', { 
                  required: 'Bitte bestätigen Sie die Stornierung' 
                })}
                className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Ich bestätige, dass ich diese Rechnung stornieren möchte und verstehe, 
                dass dieser Vorgang nicht rückgängig gemacht werden kann.
              </span>
            </label>
            {errors.confirm && <span className="text-sm text-red-600 mt-1 block">{errors.confirm.message}</span>}
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
              disabled={createStorno.isLoading || !watchConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {createStorno.isLoading ? 'Erstelle Storno...' : 'Storno erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};