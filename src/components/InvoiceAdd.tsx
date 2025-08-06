import React from 'react';
import { ArrowLeft } from 'lucide-react';
import InvoiceForm from './InvoiceForm';

interface InvoiceAddProps {
  onBack: () => void;
}

const InvoiceAdd: React.FC<InvoiceAddProps> = ({ onBack }) => {
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
          <h1 className="text-2xl font-bold text-gray-900">Neue Rechnung</h1>
          <p className="text-gray-600">Erstellen Sie eine neue Rechnung</p>
        </div>
      </div>

      {/* Invoice Form */}
      <InvoiceForm onSuccess={onBack} />
    </div>
  );
};

export default InvoiceAdd;