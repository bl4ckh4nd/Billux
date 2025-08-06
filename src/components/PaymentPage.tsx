import React, { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CreditCard, Shield, Check, AlertCircle, Loader2 } from 'lucide-react';

interface PaymentPageProps {
  invoiceData: {
    number: string;
    date: string;
    dueDate: string;
    amount: number;
    customerName: string;
    companyName: string;
    description?: string;
  };
  onPaymentSubmit: (paymentData: PaymentFormData) => Promise<void>;
}

interface PaymentFormData {
  method: 'card' | 'paypal' | 'sepa';
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
  iban?: string;
  accountHolder?: string;
}

type PaymentStep = 'method' | 'details' | 'processing' | 'success' | 'error';

const PaymentPage: React.FC<PaymentPageProps> = ({ invoiceData, onPaymentSubmit }) => {
  const [currentStep, setCurrentStep] = useState<PaymentStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'paypal' | 'sepa' | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    method: 'card',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: de });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedMethod === 'card') {
      if (!paymentForm.cardNumber) newErrors.cardNumber = 'Kartennummer ist erforderlich';
      if (!paymentForm.expiryDate) newErrors.expiryDate = 'Ablaufdatum ist erforderlich';
      if (!paymentForm.cvv) newErrors.cvv = 'CVV ist erforderlich';
      if (!paymentForm.cardholderName) newErrors.cardholderName = 'Karteninhaber ist erforderlich';
    } else if (selectedMethod === 'sepa') {
      if (!paymentForm.iban) newErrors.iban = 'IBAN ist erforderlich';
      if (!paymentForm.accountHolder) newErrors.accountHolder = 'Kontoinhaber ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!selectedMethod || !validateForm()) return;

    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      await onPaymentSubmit({ ...paymentForm, method: selectedMethod });
      setCurrentStep('success');
    } catch (error) {
      setCurrentStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Zahlungsmethode wählen</h2>
      
      <button
        onClick={() => setSelectedMethod('card')}
        className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
          selectedMethod === 'card'
            ? 'border-green-600 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center space-x-3">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <div>
            <div className="font-medium">Kreditkarte / Debitkarte</div>
            <div className="text-sm text-gray-500">Visa, Mastercard, American Express</div>
          </div>
        </div>
      </button>

      <button
        onClick={() => setSelectedMethod('paypal')}
        className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
          selectedMethod === 'paypal'
            ? 'border-green-600 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">PP</span>
          </div>
          <div>
            <div className="font-medium">PayPal</div>
            <div className="text-sm text-gray-500">Bezahlung über PayPal-Konto</div>
          </div>
        </div>
      </button>

      <button
        onClick={() => setSelectedMethod('sepa')}
        className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
          selectedMethod === 'sepa'
            ? 'border-green-600 bg-green-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">€</span>
          </div>
          <div>
            <div className="font-medium">SEPA Lastschrift</div>
            <div className="text-sm text-gray-500">Abbuchung vom Bankkonto</div>
          </div>
        </div>
      </button>

      <button
        onClick={() => setCurrentStep('details')}
        disabled={!selectedMethod}
        className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
      >
        Weiter
      </button>
    </div>
  );

  const renderPaymentDetails = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <button
          onClick={() => setCurrentStep('method')}
          className="text-green-600 hover:text-green-700"
        >
          ← Zurück
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Zahlungsdetails</h2>
      </div>

      {selectedMethod === 'card' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kartennummer
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              value={paymentForm.cardNumber || ''}
              onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 ${
                errors.cardNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.cardNumber && (
              <p className="text-red-600 text-sm mt-1">{errors.cardNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ablaufdatum
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                value={paymentForm.expiryDate || ''}
                onChange={(e) => setPaymentForm({ ...paymentForm, expiryDate: e.target.value })}
                className={`w-full border rounded-md px-3 py-2 ${
                  errors.expiryDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.expiryDate && (
                <p className="text-red-600 text-sm mt-1">{errors.expiryDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                placeholder="123"
                value={paymentForm.cvv || ''}
                onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })}
                className={`w-full border rounded-md px-3 py-2 ${
                  errors.cvv ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.cvv && (
                <p className="text-red-600 text-sm mt-1">{errors.cvv}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Karteninhaber
            </label>
            <input
              type="text"
              placeholder="Max Mustermann"
              value={paymentForm.cardholderName || ''}
              onChange={(e) => setPaymentForm({ ...paymentForm, cardholderName: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 ${
                errors.cardholderName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.cardholderName && (
              <p className="text-red-600 text-sm mt-1">{errors.cardholderName}</p>
            )}
          </div>
        </div>
      )}

      {selectedMethod === 'sepa' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IBAN
            </label>
            <input
              type="text"
              placeholder="DE89 3704 0044 0532 0130 00"
              value={paymentForm.iban || ''}
              onChange={(e) => setPaymentForm({ ...paymentForm, iban: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 ${
                errors.iban ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.iban && (
              <p className="text-red-600 text-sm mt-1">{errors.iban}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kontoinhaber
            </label>
            <input
              type="text"
              placeholder="Max Mustermann"
              value={paymentForm.accountHolder || ''}
              onChange={(e) => setPaymentForm({ ...paymentForm, accountHolder: e.target.value })}
              className={`w-full border rounded-md px-3 py-2 ${
                errors.accountHolder ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.accountHolder && (
              <p className="text-red-600 text-sm mt-1">{errors.accountHolder}</p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
      >
        {formatCurrency(invoiceData.amount)} bezahlen
      </button>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-8">
      <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Zahlung wird verarbeitet...</h2>
      <p className="text-gray-600">Bitte warten Sie einen Moment.</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Zahlung erfolgreich!</h2>
      <p className="text-gray-600 mb-4">
        Ihre Zahlung über {formatCurrency(invoiceData.amount)} wurde erfolgreich verarbeitet.
      </p>
      <p className="text-sm text-gray-500">
        Sie erhalten in Kürze eine Bestätigung per E-Mail.
      </p>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Zahlung fehlgeschlagen</h2>
      <p className="text-gray-600 mb-4">
        Ihre Zahlung konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.
      </p>
      <button
        onClick={() => setCurrentStep('method')}
        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
      >
        Erneut versuchen
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{invoiceData.companyName}</h1>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Rechnung:</span>
              <span className="font-medium">{invoiceData.number}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Datum:</span>
              <span className="text-sm">{formatDate(invoiceData.date)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Fällig:</span>
              <span className="text-sm">{formatDate(invoiceData.dueDate)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Betrag:</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(invoiceData.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {currentStep === 'method' && renderMethodSelection()}
          {currentStep === 'details' && renderPaymentDetails()}
          {currentStep === 'processing' && renderProcessing()}
          {currentStep === 'success' && renderSuccess()}
          {currentStep === 'error' && renderError()}
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Sichere Zahlung über SSL-Verschlüsselung</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;