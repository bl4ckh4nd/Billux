import React, { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { FileText, Download, ZoomIn, ZoomOut, CreditCard, Mail } from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
}

interface CustomerData {
  name: string;
  address: string;
  taxId: string;
}

type PreviewTab = 'pdf' | 'payment' | 'email';

interface InvoiceLivePreviewProps {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  type: 'Standard' | 'Abschlag' | 'Schlussrechnung';
  customerData: CustomerData;
  items: InvoiceItem[];
  retentionFee: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDownload: () => void;
}

const InvoiceLivePreview: React.FC<InvoiceLivePreviewProps> = ({
  invoiceNumber,
  date,
  dueDate,
  type,
  customerData,
  items,
  retentionFee,
  zoom,
  onZoomIn,
  onZoomOut,
  onDownload,
}) => {
  const [activeTab, setActiveTab] = useState<PreviewTab>('pdf');

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
    const total = subtotal + tax;
    const retention = total * (retentionFee / 100);
    return { subtotal, tax, total, retention };
  };

  const { subtotal, tax, total, retention } = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: de });
  };

  const getInvoiceTypeText = (type: string) => {
    switch (type) {
      case 'Abschlag': return 'Abschlagsrechnung';
      case 'Schlussrechnung': return 'Schlussrechnung';
      default: return 'Rechnung';
    }
  };

  const tabs = [
    { id: 'pdf' as PreviewTab, label: 'PDF', icon: FileText },
    { id: 'payment' as PreviewTab, label: 'Payment Page', icon: CreditCard },
    { id: 'email' as PreviewTab, label: 'Email', icon: Mail },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900">
              {activeTab === 'pdf' && 'PDF Vorschau'}
              {activeTab === 'payment' && 'Payment Page'}
              {activeTab === 'email' && 'Email Vorschau'}
            </h3>
          </div>
          {activeTab === 'pdf' && (
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={onZoomOut}
                className="p-1 hover:bg-gray-100 rounded"
                disabled={zoom <= 50}
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600 px-1 sm:px-2">{zoom}%</span>
              <button
                onClick={onZoomIn}
                className="p-1 hover:bg-gray-100 rounded"
                disabled={zoom >= 150}
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={onDownload}
                className="flex items-center space-x-1 px-2 sm:px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'pdf' && (
          <div className="p-2 sm:p-4 bg-gray-50 h-full">
            <div 
              className="bg-white mx-auto shadow-lg"
              style={{ 
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                width: '210mm',
                minHeight: '297mm',
                padding: '10mm sm:20mm'
              }}
            >
          {/* Company Header */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">B</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Billux</h1>
                </div>
                <div className="text-sm text-gray-600">
                  <div>Musterstraße 123</div>
                  <div>12345 Musterstadt</div>
                  <div>Deutschland</div>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {getInvoiceTypeText(type)}
                </h2>
                <div className="text-sm text-gray-600">
                  <div><strong>Nr:</strong> {invoiceNumber || 'INV-XXXX-XX'}</div>
                  <div><strong>Datum:</strong> {formatDate(date)}</div>
                  <div><strong>Fällig:</strong> {formatDate(dueDate)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Data */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Rechnungsempfänger</h3>
            <div className="text-sm text-gray-700">
              {customerData.name && <div className="font-medium">{customerData.name}</div>}
              {customerData.address && (
                <div className="whitespace-pre-line">{customerData.address}</div>
              )}
              {customerData.taxId && <div>Steuernummer: {customerData.taxId}</div>}
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                    Beschreibung
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">
                    Menge
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700">
                    Einheit
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium text-gray-700">
                    Einzelpreis
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-medium text-gray-700">
                    Gesamtpreis
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-gray-700">
                        {item.description}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center text-sm text-gray-700">
                        {item.unit}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-700">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-right text-sm text-gray-700">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-3 py-8 text-center text-gray-500">
                      Keine Positionen hinzugefügt
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Nettobetrag:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>MwSt. (19%):</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Gesamtbetrag:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                {retentionFee > 0 && (
                  <>
                    <div className="flex justify-between text-red-600">
                      <span>Sicherheitseinbehalt ({retentionFee}%):</span>
                      <span>-{formatCurrency(retention)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Auszahlungsbetrag:</span>
                      <span>{formatCurrency(total - retention)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200 text-xs text-gray-500">
                <div className="text-center">
                  <p>Vielen Dank für Ihr Vertrauen!</p>
                  <p className="mt-2">
                    Bankverbindung: IBAN DE12 3456 7890 1234 5678 90 | BIC: DEUTDEFF
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="p-4 sm:p-6 bg-gray-50 h-full">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Payment für Rechnung</h2>
                <p className="text-gray-600">{invoiceNumber || 'INV-XXXX-XX'}</p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Rechnungsbetrag:</span>
                    <span className="text-lg font-bold">{formatCurrency(total - retention)}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Fällig am: {formatDate(dueDate)}
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                    <CreditCard className="w-5 h-5" />
                    <span className="font-medium">Kreditkarte / Debitkarte</span>
                  </button>

                  <button className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-5 h-5 bg-blue-600 rounded"></div>
                    <span className="font-medium">PayPal</span>
                  </button>

                  <button className="w-full flex items-center justify-center space-x-3 p-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-5 h-5 bg-gray-600 rounded"></div>
                    <span className="font-medium">SEPA Lastschrift</span>
                  </button>
                </div>

                <div className="text-xs text-gray-500 text-center mt-4">
                  Sichere Zahlung über SSL-Verschlüsselung
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="p-4 sm:p-6 bg-gray-50 h-full">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
              {/* Email Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <Mail className="w-4 h-4" />
                  <span>Email Vorschau</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 w-16">Von:</span>
                    <span className="text-sm text-gray-900">rechnung@billux.com</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 w-16">An:</span>
                    <span className="text-sm text-gray-900">{customerData.name || 'kunde@example.com'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700 w-16">Betreff:</span>
                    <span className="text-sm text-gray-900">
                      Rechnung {invoiceNumber || 'INV-XXXX-XX'} - Billux
                    </span>
                  </div>
                </div>
              </div>

              {/* Email Content */}
              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  <p>Sehr geehrte Damen und Herren,</p>
                  
                  <p>
                    anbei erhalten Sie die Rechnung {invoiceNumber || 'INV-XXXX-XX'} vom {formatDate(date)} 
                    über {formatCurrency(total - retention)}.
                  </p>

                  <p>
                    <strong>Rechnungsdetails:</strong><br />
                    Rechnungsnummer: {invoiceNumber || 'INV-XXXX-XX'}<br />
                    Rechnungsdatum: {formatDate(date)}<br />
                    Fälligkeitsdatum: {formatDate(dueDate)}<br />
                    Betrag: {formatCurrency(total - retention)}
                  </p>

                  <p>
                    Sie können diese Rechnung bequem online bezahlen über den folgenden Link:
                  </p>

                  <div className="my-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <a href="#" className="text-green-600 font-medium hover:underline">
                      → Rechnung online bezahlen
                    </a>
                  </div>

                  <p>
                    Alternativ können Sie den Betrag auf unser Konto überweisen:<br />
                    IBAN: DE12 3456 7890 1234 5678 90<br />
                    BIC: DEUTDEFF<br />
                    Verwendungszweck: {invoiceNumber || 'INV-XXXX-XX'}
                  </p>

                  <p>
                    Bei Fragen stehen wir Ihnen gerne zur Verfügung.
                  </p>

                  <p>
                    Mit freundlichen Grüßen<br />
                    Ihr Billux Team
                  </p>
                </div>

                {/* Attachment */}
                <div className="mt-6 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Anhang:</span>
                    <span className="text-sm text-gray-600">
                      Rechnung_{invoiceNumber || 'INV-XXXX-XX'}.pdf
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceLivePreview;