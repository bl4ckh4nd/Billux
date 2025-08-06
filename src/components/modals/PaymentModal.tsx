import React from 'react';
import { useForm } from 'react-hook-form';
import { X, CreditCard, Calendar, FileText, Euro } from 'lucide-react';
import { useAddPayment } from '../../hooks/useInvoices';
import type { PaymentMethod, Invoice } from '../../types/invoice';

interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
}

interface PaymentFormData {
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
}

const paymentMethods: { value: PaymentMethod; label: string; icon?: React.FC<{ className?: string }> }[] = [
  { value: 'bank', label: 'Überweisung', icon: CreditCard },
  { value: 'cash', label: 'Barzahlung' },
  { value: 'card', label: 'Kartenzahlung', icon: CreditCard },
  { value: 'online_card', label: 'Online Kartenzahlung', icon: CreditCard },
  { value: 'online_paypal', label: 'PayPal' },
  { value: 'online_sepa', label: 'SEPA Lastschrift' }
];

export const PaymentModal: React.FC<PaymentModalProps> = ({ invoice, onClose }) => {
  const addPayment = useAddPayment();
  const remainingAmount = invoice.amount - invoice.paidAmount;

  const { register, handleSubmit, formState: { errors }, watch } = useForm<PaymentFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      amount: remainingAmount,
      method: 'bank',
      reference: ''
    }
  });

  const watchedAmount = watch('amount');
  const isOverpayment = watchedAmount > remainingAmount;

  const onSubmit = (data: PaymentFormData) => {
    addPayment.mutate({
      invoiceId: invoice.id,
      payment: {
        date: data.date,
        amount: data.amount,
        method: data.method,
        reference: data.reference
      }
    }, {
      onSuccess: () => {
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
              Zahlung erfassen
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
          {/* Invoice Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <FileText className="w-5 h-5 mr-2 text-teal-600" />
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
                <span className="text-gray-600">Gesamtbetrag:</span>
                <span className="ml-2 font-medium">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Offener Betrag:</span>
                <span className="ml-2 font-medium text-red-600">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(remainingAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Zahlungsdatum *
                </label>
                <input
                  type="date"
                  {...register('date', { required: 'Zahlungsdatum ist erforderlich' })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
                {errors.date && <span className="text-sm text-red-600 mt-1">{errors.date.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Euro className="w-4 h-4 inline mr-1" />
                  Betrag * (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('amount', { 
                    required: 'Betrag ist erforderlich',
                    min: { value: 0.01, message: 'Betrag muss größer als 0 sein' },
                    max: { value: remainingAmount * 1.1, message: 'Betrag ist zu hoch' },
                    valueAsNumber: true
                  })}
                  className={`block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 ${
                    isOverpayment ? 'border-orange-300' : ''
                  }`}
                />
                {errors.amount && <span className="text-sm text-red-600 mt-1">{errors.amount.message}</span>}
                {isOverpayment && !errors.amount && (
                  <span className="text-sm text-orange-600 mt-1">
                    Achtung: Zahlung übersteigt offenen Betrag
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <CreditCard className="w-4 h-4 inline mr-1" />
                Zahlungsart *
              </label>
              <select
                {...register('method', { required: 'Zahlungsart ist erforderlich' })}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              {errors.method && <span className="text-sm text-red-600 mt-1">{errors.method.message}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referenz / Verwendungszweck
              </label>
              <input
                type="text"
                {...register('reference')}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                placeholder="z.B. Überweisung vom 01.01.2024"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="pt-2">
            <p className="text-sm text-gray-600 mb-2">Schnellauswahl:</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const form = document.querySelector('form') as HTMLFormElement;
                  const amountInput = form.querySelector('input[name="amount"]') as HTMLInputElement;
                  amountInput.value = remainingAmount.toString();
                  amountInput.dispatchEvent(new Event('change', { bubbles: true }));
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Vollständig ({new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(remainingAmount)})
              </button>
              {remainingAmount > 100 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const form = document.querySelector('form') as HTMLFormElement;
                      const amountInput = form.querySelector('input[name="amount"]') as HTMLInputElement;
                      amountInput.value = (remainingAmount * 0.5).toFixed(2);
                      amountInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    50% ({new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(remainingAmount * 0.5)})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const form = document.querySelector('form') as HTMLFormElement;
                      const amountInput = form.querySelector('input[name="amount"]') as HTMLInputElement;
                      amountInput.value = (remainingAmount * 0.25).toFixed(2);
                      amountInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    25% ({new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(remainingAmount * 0.25)})
                  </button>
                </>
              )}
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
              disabled={addPayment.isLoading}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {addPayment.isLoading ? 'Speichere...' : 'Zahlung erfassen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};