import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, FileText, Euro, Info } from 'lucide-react';
import { useCreateCreditNote } from '../../hooks/useCreateCreditNote';
import type { Invoice } from '../../types/invoice';

interface CreditNoteModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSuccess?: (newInvoiceId: string) => void;
}

interface CreditNoteFormData {
  creditType: 'full' | 'partial' | 'custom';
  amount: number;
  reason: string;
  description: string;
}

const creditReasons = [
  'Teilweise Leistung nicht erbracht',
  'Qualitätsmängel',
  'Preiskorrektur',
  'Kulanz',
  'Vertragliche Vereinbarung',
  'Sonstiges'
];

export const CreditNoteModal: React.FC<CreditNoteModalProps> = ({ 
  invoice, 
  onClose,
  onSuccess 
}) => {
  const createCreditNote = useCreateCreditNote();
  const [creditType, setCreditType] = useState<'full' | 'partial' | 'custom'>('full');

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CreditNoteFormData>({
    defaultValues: {
      creditType: 'full',
      amount: invoice.amount,
      reason: '',
      description: ''
    }
  });

  const watchCreditType = watch('creditType');
  const watchAmount = watch('amount');

  const handleCreditTypeChange = (type: 'full' | 'partial' | 'custom') => {
    setCreditType(type);
    setValue('creditType', type);
    
    if (type === 'full') {
      setValue('amount', invoice.amount);
    } else if (type === 'partial') {
      setValue('amount', invoice.amount * 0.5);
    }
  };

  const onSubmit = (data: CreditNoteFormData) => {
    createCreditNote.mutate({
      invoiceId: invoice.id,
      amount: data.amount,
      reason: data.reason,
      items: [{
        description: data.description || `Gutschrift für Rechnung ${invoice.number}`,
        quantity: 1,
        unitPrice: data.amount,
        total: data.amount
      }]
    }, {
      onSuccess: (newCreditNote) => {
        onSuccess?.(newCreditNote.id);
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Gutschrift erstellen
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
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
                <span className="text-gray-600">Rechnungsbetrag:</span>
                <span className="ml-2 font-medium">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Bereits bezahlt:</span>
                <span className="ml-2 font-medium">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.paidAmount)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Art der Gutschrift
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleCreditTypeChange('full')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  creditType === 'full' 
                    ? 'border-teal-500 bg-teal-50 text-teal-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">Vollständig</div>
                <div className="text-sm text-gray-600 mt-1">100% Gutschrift</div>
              </button>
              <button
                type="button"
                onClick={() => handleCreditTypeChange('partial')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  creditType === 'partial' 
                    ? 'border-teal-500 bg-teal-50 text-teal-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">Teilweise</div>
                <div className="text-sm text-gray-600 mt-1">50% Gutschrift</div>
              </button>
              <button
                type="button"
                onClick={() => handleCreditTypeChange('custom')}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  creditType === 'custom' 
                    ? 'border-teal-500 bg-teal-50 text-teal-700' 
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">Individuell</div>
                <div className="text-sm text-gray-600 mt-1">Betrag festlegen</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Euro className="w-4 h-4 inline mr-1" />
              Gutschriftbetrag * (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={invoice.amount}
              {...register('amount', { 
                required: 'Betrag ist erforderlich',
                min: { value: 0.01, message: 'Betrag muss größer als 0 sein' },
                max: { value: invoice.amount, message: 'Betrag darf Rechnungsbetrag nicht überschreiten' },
                valueAsNumber: true
              })}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              readOnly={creditType !== 'custom'}
            />
            {errors.amount && <span className="text-sm text-red-600 mt-1">{errors.amount.message}</span>}
            
            {watchAmount > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Das entspricht {((watchAmount / invoice.amount) * 100).toFixed(1)}% des Rechnungsbetrags
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grund der Gutschrift *
            </label>
            <select
              {...register('reason', { required: 'Grund ist erforderlich' })}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
            >
              <option value="">Bitte wählen...</option>
              {creditReasons.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
            {errors.reason && <span className="text-sm text-red-600 mt-1">{errors.reason.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschreibung (optional)
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              placeholder="Zusätzliche Details zur Gutschrift..."
            />
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Hinweis zur Gutschrift:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Eine neue Gutschrift mit der Nummer {new Date().getFullYear()}-XXXX-G wird erstellt</li>
                  <li>Die Gutschrift wird automatisch als "bezahlt" markiert</li>
                  {invoice.paidAmount > 0 && (
                    <li>Der bezahlte Betrag der Originalrechnung wird entsprechend reduziert</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={createCreditNote.isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {createCreditNote.isLoading ? 'Erstelle...' : 'Gutschrift erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};