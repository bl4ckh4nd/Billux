import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, FileText, Download, Trash2, Edit, MoreVertical } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useInvoices, useDeleteInvoice, useUpdateInvoice } from '../hooks/useInvoices';
import { usePayments } from '../hooks/usePayments';
import AuditTrail from './AuditTrail';
import { usePdfGeneration, useDownloadPdf } from '../hooks/usePdf';
import { PDFViewer } from '@react-pdf/renderer';
import type { Invoice, PaymentMethod, CreatePaymentDTO } from '../types/invoice';
import InvoiceForm from './InvoiceForm';

interface InvoiceDetailProps {
  invoice: Invoice;
  onBack: () => void;
}

const InvoiceDetail: React.FC<InvoiceDetailProps> = ({ invoice, onBack }) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [paymentReference, setPaymentReference] = useState('');
  const { data: project } = useProjects();
  const { data: allInvoices } = useInvoices();
  const { addPayment } = usePayments();
  const [previousInvoicesTotal, setPreviousInvoicesTotal] = useState(0);
  const [projectTotal, setProjectTotal] = useState(0);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const { data: pdfData, isLoading: isPdfLoading } = usePdfGeneration({ documentId: invoice.id });
  const downloadPdf = useDownloadPdf();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const deleteInvoiceMutation = useDeleteInvoice();
  const updateInvoiceMutation = useUpdateInvoice();

  useEffect(() => {
    if (invoice.projectId && allInvoices) {
      const projectInvoices = (allInvoices as Invoice[]).filter(
        (inv: Invoice) => inv.projectId === invoice.projectId
      );
      const previousTotal = projectInvoices
        .filter((inv: Invoice) => inv.type === 'Abschlag')
        .reduce((sum: number, inv: Invoice) => sum + inv.amount, 0);
      setPreviousInvoicesTotal(previousTotal);
      setProjectTotal(previousTotal + invoice.amount);
    }
  }, [invoice, allInvoices]);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPayment: CreatePaymentDTO = {
      date: new Date().toISOString(),
      amount: parseFloat(paymentAmount),
      method: paymentMethod,
      reference: paymentReference,
      invoiceId: invoice.id
    };

    addPayment.mutate(newPayment, {
      onSuccess: () => {
        setShowPaymentForm(false);
        setPaymentAmount('');
        setPaymentReference('');
      }
    });
  };
  
  const handleDownloadPdf = () => {
    if (invoice) {
      downloadPdf.mutate({ documentId: invoice.id });
    }
  };

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPaymentMethod(e.target.value as PaymentMethod);
  };

  const handleDelete = async () => {
    if (invoice.status === 'Bezahlt') {
      alert('Bezahlte Rechnungen können nicht gelöscht werden.');
      return;
    }

    try {
      await deleteInvoiceMutation.mutateAsync(invoice.id);
      onBack();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Fehler beim Löschen der Rechnung');
    }
  };

  const handleEdit = () => {
    if (invoice.status === 'Bezahlt') {
      alert('Bezahlte Rechnungen können nicht bearbeitet werden.');
      return;
    }
    setShowEditForm(true);
  };

  const handleUpdateSuccess = () => {
    setShowEditForm(false);
  };

  const remainingAmount = invoice.amount - invoice.paidAmount;

  if (showEditForm) {
    return <InvoiceForm onSuccess={handleUpdateSuccess} isEditMode initialData={invoice} />;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-[#1D1616]">Rechnung {invoice.number}</h2>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </button>
          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
              <button
                onClick={handleEdit}
                disabled={invoice.status === 'Bezahlt'}
                className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-100 disabled:opacity-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Bearbeiten
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={invoice.status === 'Bezahlt'}
                className="w-full px-4 py-2 text-left flex items-center text-[#D84040] hover:bg-gray-100 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Löschen
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Rechnung löschen</h3>
            <p className="mb-6">Sind Sie sicher, dass Sie diese Rechnung löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="bg-[#D84040] hover:bg-[#8E1616] text-white px-4 py-2 rounded-lg"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Rechnungsdetails</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Datum:</span>
              <span>{new Date(invoice.date).toLocaleDateString('de-DE')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fälligkeitsdatum:</span>
              <span>{new Date(invoice.dueDate).toLocaleDateString('de-DE')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Kunde:</span>
              <span>{invoice.customer}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Gesamtbetrag:</span>
              <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Zahlungsstatus</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Bezahlt:</span>
              <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Offen:</span>
              <span className="text-[#D84040]">{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(remainingAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-semibold ${
                invoice.status === 'Bezahlt' ? 'text-green-600' :
                invoice.status === 'Überfällig' ? 'text-[#D84040]' :
                invoice.status === 'Teilweise bezahlt' ? 'text-orange-500' :
                'text-[#8E1616]'
              }`}>{invoice.status}</span>
            </div>
          </div>
        </div>

        {invoice.type !== 'Standard' && (
          <div className="flex justify-between">
            <span className="text-gray-600">Rechnungstyp:</span>
            <span className="font-semibold">
              {invoice.type === 'Abschlag' ? 'Abschlagsrechnung' : 'Schlussrechnung'}
            </span>
          </div>
        )}

        {invoice.projectId && (
          <div className="flex justify-between">
            <span className="text-gray-600">Projekt:</span>
            <span className="text-[#D84040]">{project?.find(p => p.id === invoice.projectId)?.title}</span>
          </div>
        )}

        {invoice.type === 'Schlussrechnung' && (
          <>
            <div className="border-t border-gray-200 my-2 pt-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Bisherige Abschläge:</span>
                <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(previousInvoicesTotal)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Gesamtprojektsumme:</span>
                <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(projectTotal)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {(invoice.type === 'Storno' || invoice.type === 'Gutschrift') && invoice.metadata?.relatedInvoiceId && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="text-sm font-medium mb-1">
            {invoice.type === 'Storno' ? 'Stornierte Rechnung:' : 'Bezieht sich auf Rechnung:'}
          </div>
          <div className="flex justify-between">
            <span>{invoice.metadata.relatedInvoiceNumber}</span>
            {invoice.metadata?.relatedInvoiceAmount && (
              <span className="font-medium">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
                  .format(invoice.metadata.relatedInvoiceAmount)}
              </span>
            )}
          </div>
          {invoice.type === 'Storno' && invoice.metadata.stornoReason && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Grund für Storno:</span> {invoice.metadata.stornoReason}
            </div>
          )}
        </div>
      )}

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Zahlungsverlauf</h3>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="flex items-center text-[#D84040] hover:text-[#8E1616]"
          >
            <Plus className="w-4 h-4 mr-1" />
            Zahlung hinzufügen
          </button>
        </div>

        {showPaymentForm && (
          <form onSubmit={handlePaymentSubmit} className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Betrag</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zahlungsart</label>
                <select
                  value={paymentMethod}
                  onChange={handleMethodChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="bank">Überweisung</option>
                  <option value="cash">Barzahlung</option>
                  <option value="card">Kartenzahlung</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referenz</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="z.B. Überweisungsreferenz"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="bg-[#D84040] hover:bg-[#8E1616] text-white px-4 py-2 rounded-lg transition duration-200"
              >
                Zahlung speichern
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zahlungsart</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referenz</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(payment.date).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(payment.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {payment.method === 'bank' ? 'Überweisung' :
                     payment.method === 'cash' ? 'Barzahlung' : 'Kartenzahlung'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {payment.reference}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Dokumentenverlauf</h3>
          <button
            onClick={() => setShowAuditTrail(!showAuditTrail)}
            className="text-[#8E1616] hover:text-[#D84040] text-sm"
          >
            {showAuditTrail ? 'Verlauf ausblenden' : 'Vollständigen Verlauf anzeigen'}
          </button>
        </div>
        
        {showAuditTrail ? (
          <AuditTrail documentId={invoice.id} documentType="Invoice" />
        ) : (
          <AuditTrail documentId={invoice.id} documentType="Invoice" compact />
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <button 
          onClick={() => setShowPdfPreview(!showPdfPreview)}
          className="flex items-center text-[#8E1616] hover:text-[#D84040]"
        >
          <FileText className="w-5 h-5 mr-2" />
          {showPdfPreview ? 'PDF ausblenden' : 'PDF anzeigen'}
        </button>
        <button
          onClick={handleDownloadPdf}
          className="flex items-center text-[#8E1616] hover:text-[#D84040]"
          disabled={isPdfLoading || downloadPdf.isLoading}
        >
          <Download className="w-5 h-5 mr-2" />
          PDF herunterladen
        </button>
      </div>

      {showPdfPreview && (
        <div className="mt-6">
          {isPdfLoading ? (
            <div className="w-full h-96 flex items-center justify-center">
              Generiere PDF...
            </div>
          ) : pdfData && pdfData.component ? (
            <PDFViewer width="100%" height="600px">
              <pdfData.component />
            </PDFViewer>
          ) : (
            <div className="w-full h-96 flex items-center justify-center" style={{ color: 'var(--error)' }}>
              PDF konnte nicht generiert werden
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;