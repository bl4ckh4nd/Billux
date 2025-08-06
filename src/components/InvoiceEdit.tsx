import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useInvoice } from '../hooks/useInvoice';
import InvoiceFormEdit from './InvoiceFormEdit';

interface InvoiceEditProps {
  invoiceId: string;
  onBack: () => void;
}

const InvoiceEdit: React.FC<InvoiceEditProps> = ({ invoiceId, onBack }) => {
  const { data: invoice, isLoading, error } = useInvoice(invoiceId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rechnung bearbeiten</h1>
            <p className="text-gray-600">Rechnung wird geladen...</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rechnung bearbeiten</h1>
            <p className="text-gray-600">Fehler beim Laden der Rechnung</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-center text-gray-500">
            {error ? 'Fehler beim Laden der Rechnung' : 'Rechnung nicht gefunden'}
          </div>
        </div>
      </div>
    );
  }

  // Check if invoice can be edited
  if (invoice.status === 'Bezahlt') {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rechnung bearbeiten</h1>
            <p className="text-gray-600">Rechnung {invoice.number}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-center text-gray-500">
            <p className="text-lg font-medium mb-2">Rechnung kann nicht bearbeitet werden</p>
            <p>Bezahlte Rechnungen können nicht mehr bearbeitet werden.</p>
            <button
              onClick={onBack}
              className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
            >
              Zurück zur Rechnungsansicht
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rechnung bearbeiten</h1>
          <p className="text-gray-600">Rechnung {invoice.number} bearbeiten</p>
        </div>
      </div>

      {/* Invoice Edit Form */}
      <InvoiceFormEdit invoice={invoice} onSuccess={onBack} />
    </div>
  );
};

export default InvoiceEdit;