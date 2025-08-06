import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Bell, Calendar, Euro, AlertTriangle, Info } from 'lucide-react';
import { useSendReminder } from '../../hooks/useInvoiceReminders';
import type { Invoice } from '../../types/invoice';
import type { ReminderLevel } from '../../types/reminder';

interface ReminderModalProps {
  invoice: Invoice;
  reminderLevel: ReminderLevel;
  onClose: () => void;
}

interface ReminderFormData {
  dueDate: string;
  fee: number;
  includeInterest: boolean;
  interestRate: number;
  customMessage: string;
}

const getReminderFeeByLevel = (level: ReminderLevel): number => {
  switch (level) {
    case ReminderLevel.FRIENDLY: return 0; // Zahlungserinnerung
    case ReminderLevel.FIRST_REMINDER: return 5; // 1. Mahnung
    case ReminderLevel.SECOND_REMINDER: return 10; // 2. Mahnung
    case ReminderLevel.FINAL_NOTICE: return 15; // Letzte Mahnung
    default: return 0;
  }
};

const getReminderTitle = (level: ReminderLevel): string => {
  switch (level) {
    case ReminderLevel.FRIENDLY: return 'Zahlungserinnerung';
    case ReminderLevel.FIRST_REMINDER: return '1. Mahnung';
    case ReminderLevel.SECOND_REMINDER: return '2. Mahnung';
    case ReminderLevel.FINAL_NOTICE: return 'Letzte Mahnung';
    default: return 'Mahnung';
  }
};

const getReminderDueDays = (level: ReminderLevel): number => {
  switch (level) {
    case ReminderLevel.FRIENDLY: return 7; // 7 days for payment reminder
    case ReminderLevel.FIRST_REMINDER: return 10; // 10 days for 1st reminder
    case ReminderLevel.SECOND_REMINDER: return 7; // 7 days for 2nd reminder
    case ReminderLevel.FINAL_NOTICE: return 5; // 5 days for final reminder
    default: return 7;
  }
};

export const ReminderModal: React.FC<ReminderModalProps> = ({ invoice, reminderLevel, onClose }) => {
  const sendReminder = useSendReminder();
  
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + getReminderDueDays(reminderLevel));
  
  const defaultFee = getReminderFeeByLevel(reminderLevel);
  const daysSinceOriginalDue = Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
  const defaultInterest = daysSinceOriginalDue > 0 ? (invoice.amount * 0.09 * daysSinceOriginalDue / 365) : 0;

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ReminderFormData>({
    defaultValues: {
      dueDate: defaultDueDate.toISOString().split('T')[0],
      fee: defaultFee,
      includeInterest: reminderLevel >= ReminderLevel.SECOND_REMINDER,
      interestRate: 9,
      customMessage: ''
    }
  });

  const watchIncludeInterest = watch('includeInterest');
  const watchInterestRate = watch('interestRate');

  const calculateInterest = () => {
    if (!watchIncludeInterest) return 0;
    return (invoice.amount * (watchInterestRate / 100) * daysSinceOriginalDue / 365);
  };

  const totalAdditionalCharges = defaultFee + (watchIncludeInterest ? calculateInterest() : 0);
  const totalAmount = invoice.amount + totalAdditionalCharges;

  const onSubmit = (data: ReminderFormData) => {
    sendReminder.mutate({
      invoiceId: invoice.id,
      reminderData: {
        level: reminderLevel,
        dueDate: data.dueDate,
        reminderFee: data.fee,
        interestAmount: data.includeInterest ? calculateInterest() : 0,
        message: data.customMessage
      }
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {getReminderTitle(reminderLevel)} senden
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
          {/* Warning for Final Reminder */}
          {reminderLevel === ReminderLevel.FINAL_NOTICE && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900">Letzte Mahnung</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Dies ist die letzte Mahnung vor rechtlichen Schritten. Nach Ablauf der Frist kann ein gerichtliches Mahnverfahren eingeleitet werden.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Info className="w-5 h-5 mr-2 text-teal-600" />
              <h3 className="font-semibold text-gray-900">Rechnungsinformation</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Rechnungsnummer:</span>
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
                <span className="text-gray-600">Überfällig seit:</span>
                <span className="ml-2 font-medium text-red-600">
                  {daysSinceOriginalDue} Tagen
                </span>
              </div>
              {invoice.lastReminderDate && (
                <>
                  <div>
                    <span className="text-gray-600">Letzte Mahnung:</span>
                    <span className="ml-2 font-medium">
                      {new Date(invoice.lastReminderDate).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Bisherige Mahngebühren:</span>
                    <span className="ml-2 font-medium text-orange-600">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.totalReminderFees || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Reminder Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Neue Fälligkeitsdatum *
                </label>
                <input
                  type="date"
                  {...register('dueDate', { 
                    required: 'Fälligkeitsdatum ist erforderlich',
                    validate: (value) => {
                      const selectedDate = new Date(value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (selectedDate <= today) {
                        return 'Fälligkeitsdatum muss in der Zukunft liegen';
                      }
                      return true;
                    }
                  })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
                {errors.dueDate && <span className="text-sm text-red-600 mt-1">{errors.dueDate.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Euro className="w-4 h-4 inline mr-1" />
                  Mahngebühr (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('fee', { 
                    min: { value: 0, message: 'Mahngebühr kann nicht negativ sein' },
                    valueAsNumber: true
                  })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
                {errors.fee && <span className="text-sm text-red-600 mt-1">{errors.fee.message}</span>}
              </div>
            </div>

            {/* Interest Calculation */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  {...register('includeInterest')}
                  className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <div className="ml-3 flex-1">
                  <label className="font-medium text-gray-900">Verzugszinsen berechnen</label>
                  <p className="text-sm text-gray-600 mt-1">
                    Verzugszinsen nach BGB §288 (aktuell 9% über Basiszinssatz)
                  </p>
                  {watchIncludeInterest && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Zinssatz (% p.a.)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="20"
                          {...register('interestRate', { 
                            min: { value: 0, message: 'Zinssatz kann nicht negativ sein' },
                            max: { value: 20, message: 'Zinssatz zu hoch' },
                            valueAsNumber: true
                          })}
                          className="block w-32 rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                        />
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Berechnete Zinsen:</span>
                        <span className="ml-2 font-medium text-orange-600">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(calculateInterest())}
                        </span>
                        <span className="text-gray-500 ml-1">
                          ({daysSinceOriginalDue} Tage × {watchInterestRate}% p.a.)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zusätzliche Nachricht (optional)
              </label>
              <textarea
                {...register('customMessage')}
                rows={3}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                placeholder="Zusätzlicher Text für die Mahnung..."
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-teal-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Zusammenfassung</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Rechnungsbetrag:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mahngebühr:</span>
                <span className="font-medium">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(defaultFee)}
                </span>
              </div>
              {watchIncludeInterest && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Verzugszinsen:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(calculateInterest())}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-teal-200">
                <span className="font-semibold text-gray-900">Gesamt zu zahlen:</span>
                <span className="font-bold text-teal-600">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalAmount)}
                </span>
              </div>
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
              disabled={sendReminder.isLoading}
              className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                reminderLevel === ReminderLevel.FINAL_NOTICE 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {sendReminder.isLoading ? 'Sende...' : `${getReminderTitle(reminderLevel)} senden`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};