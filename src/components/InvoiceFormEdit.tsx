import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Trash2, Search, Save, Send } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useInvoices, useUpdateInvoice } from '../hooks/useInvoices';
import { useArticles } from '../hooks/useArticles';
import InvoiceLivePreview from './InvoiceLivePreview';
import type { Invoice } from '../types/invoice';

interface Article {
  id: string;
  name: string;
  description: string;
  unit: string;
  basePrice: number;
  category: string;
}

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Rechnungsnummer ist erforderlich"),
  date: z.string(),
  dueDate: z.string(),
  type: z.enum(['Standard', 'Abschlag', 'Schlussrechnung']),
  projectId: z.string().optional(),
  customerData: z.object({
    name: z.string().min(1, "Kundenname ist erforderlich"),
    address: z.string().min(1, "Adresse ist erforderlich"),
    taxId: z.string().min(1, "Steuernummer ist erforderlich"),
  }),
  items: z.array(z.object({
    articleId: z.string(),
    description: z.string().min(1, "Beschreibung ist erforderlich"),
    quantity: z.number().min(0.01),
    unit: z.string().min(1, "Einheit ist erforderlich"),
    unitPrice: z.number().min(0.01),
    taxRate: z.number(),
  })),
  retentionFee: z.number().min(0).max(100),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormEditProps {
  invoice: Invoice;
  onSuccess?: () => void;
}

const InvoiceFormEdit: React.FC<InvoiceFormEditProps> = ({ invoice, onSuccess }) => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: invoice.number,
      date: format(new Date(invoice.date), 'yyyy-MM-dd'),
      dueDate: format(new Date(invoice.dueDate), 'yyyy-MM-dd'),
      type: invoice.type as 'Standard' | 'Abschlag' | 'Schlussrechnung',
      projectId: invoice.projectId || '',
      items: invoice.items?.map(item => ({
        articleId: item.articleId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 19,
      })) || [],
      retentionFee: invoice.retentionFee || 5,
      customerData: {
        name: invoice.customerData?.company || invoice.customerData?.name || invoice.customer || '',
        address: invoice.customerData?.address || '',
        taxId: invoice.customerData?.taxId || '',
      },
    },
  });

  const { mutate: updateInvoice, isLoading: isUpdating } = useUpdateInvoice();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(75);

  const [showArticleSelector, setShowArticleSelector] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: projects } = useProjects();
  const { data: allInvoices } = useInvoices();
  const { data: articles = [] } = useArticles();
  const [previousInvoices, setPreviousInvoices] = useState<Invoice[]>([]);
  const [totalPreviousAmount, setTotalPreviousAmount] = useState(0);

  const watchType = watch('type');
  const watchProjectId = watch('projectId');

  useEffect(() => {
    if (watchProjectId && allInvoices) {
      const projectInvoices = allInvoices.filter(
        inv => inv.projectId === watchProjectId && inv.type === 'Abschlag' && inv.id !== invoice.id
      );
      setPreviousInvoices(projectInvoices);
      setTotalPreviousAmount(
        projectInvoices.reduce((sum, inv) => sum + inv.amount, 0)
      );
    }
  }, [watchProjectId, allInvoices, invoice.id]);

  const items = watch('items');

  const filteredArticles = articles.filter(article =>
    article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addItem = () => {
    setShowArticleSelector(true);
    setSelectedItemIndex(items.length);
  };

  const selectArticle = (article: Article) => {
    const newItem = {
      articleId: article.id,
      description: article.description,
      quantity: 1,
      unit: article.unit,
      unitPrice: article.basePrice,
      taxRate: 19,
    };

    if (selectedItemIndex !== null) {
      const newItems = [...items];
      newItems[selectedItemIndex] = newItem;
      setValue('items', newItems);
    } else {
      setValue('items', [...items, newItem]);
    }

    setShowArticleSelector(false);
    setSelectedItemIndex(null);
    setSearchTerm('');
  };

  const removeItem = (index: number) => {
    setValue('items', items.filter((_, i) => i !== index));
  };

  const onSubmit = (data: InvoiceFormData) => {
    const invoiceData = {
      number: data.invoiceNumber,
      date: data.date,
      customerId: invoice.customerId,
      projectId: data.projectId,
      items: data.items.map(item => ({
        articleId: item.articleId,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
      })),
      dueDate: data.dueDate,
      retentionFee: data.retentionFee,
      type: data.type,
      customerData: {
        name: data.customerData.name,
        company: data.customerData.name,
        address: data.customerData.address,
        taxId: data.customerData.taxId,
      },
    };

    updateInvoice(
      { id: invoice.id, data: invoiceData },
      {
        onSuccess: () => {
          setShowSuccessMessage(true);
          setTimeout(() => {
            setShowSuccessMessage(false);
            onSuccess?.();
          }, 1500);
        },
        onError: (error) => {
          console.error('Failed to update invoice:', error);
        }
      }
    );
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
    const total = subtotal + tax;
    const retention = total * (watch('retentionFee') / 100);
    return { subtotal, tax, total, retention };
  };

  const { subtotal, tax, total, retention } = calculateTotals();

  const handleZoomIn = () => {
    setPreviewZoom(prev => Math.min(prev + 25, 150));
  };

  const handleZoomOut = () => {
    setPreviewZoom(prev => Math.max(prev - 25, 50));
  };

  const handleDownload = () => {
    console.log('Download PDF');
  };

  const ArticleSelector = () => (
    <div className="absolute z-10 top-16 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Artikel suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>
      <div className="max-h-64 overflow-y-auto">
        {filteredArticles.map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={() => selectArticle(article)}
            className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
          >
            <div className="font-medium">{article.name}</div>
            <div className="text-sm text-gray-500">{article.description}</div>
            <div className="text-sm text-green-600">
              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(article.basePrice)} / {article.unit}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Action buttons */}
      <div className="mb-6 flex justify-end">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Als Entwurf speichern</span>
            <span className="sm:hidden">Entwurf</span>
          </button>
          <button
            type="submit"
            form="invoice-form"
            disabled={isUpdating}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{isUpdating ? 'Wird aktualisiert...' : 'Rechnung aktualisieren'}</span>
            <span className="sm:hidden">Aktualisieren</span>
          </button>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
          Rechnung wurde erfolgreich aktualisiert!
        </div>
      )}

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Panel - Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Rechnungsdetails bearbeiten</h2>
            
            <form id="invoice-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Invoice Details Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rechnungsnummer</label>
                    <input
                      {...register('invoiceNumber')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="RE-2024-XXX"
                    />
                    {errors.invoiceNumber && (
                      <p className="text-red-600 text-sm mt-1">{errors.invoiceNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rechnungsdatum</label>
                    <input
                      type="date"
                      {...register('date')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fälligkeitsdatum</label>
                  <input
                    type="date"
                    {...register('dueDate')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Invoice Type and Project */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rechnungstyp</label>
                  <select
                    {...register('type')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Standard">Standardrechnung</option>
                    <option value="Abschlag">Abschlagsrechnung</option>
                    <option value="Schlussrechnung">Schlussrechnung</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Projekt</label>
                  <select
                    {...register('projectId')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Kein Projekt</option>
                    {projects?.map(project => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Previous Invoices (if applicable) */}
              {watchType !== 'Standard' && watchProjectId && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Bisherige Abschlagsrechnungen</h3>
                  <div className="space-y-1">
                    {previousInvoices.length > 0 ? (
                      previousInvoices.map(invoice => (
                        <div key={invoice.id} className="flex justify-between py-1 text-sm">
                          <span>{invoice.number}</span>
                          <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">Keine vorherigen Rechnungen</p>
                    )}
                    
                    {watchType === 'Schlussrechnung' && (
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-medium text-sm">
                          <span>Gesamtsumme bisheriger Abschläge:</span>
                          <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalPreviousAmount)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Data Section */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Rechnungsempfänger</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      {...register('customerData.name')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Firmenname oder Privatperson"
                    />
                    {errors.customerData?.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.customerData.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Steuernummer</label>
                    <input
                      {...register('customerData.taxId')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="DE123456789"
                    />
                    {errors.customerData?.taxId && (
                      <p className="text-red-600 text-sm mt-1">{errors.customerData.taxId.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <textarea
                    {...register('customerData.address')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    placeholder="Straße, Hausnummer&#10;PLZ Ort&#10;Land"
                  />
                  {errors.customerData?.address && (
                    <p className="text-red-600 text-sm mt-1">{errors.customerData.address.message}</p>
                  )}
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4 relative">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-semibold text-gray-900">Positionen</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center space-x-1 text-green-600 hover:text-green-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Position hinzufügen</span>
                  </button>
                </div>

                {showArticleSelector && <ArticleSelector />}

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="sm:col-span-2 lg:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
                          <input
                            {...register(`items.${index}.description`)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Menge</label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Einheit</label>
                          <input
                            {...register(`items.${index}.unit`)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Einzelpreis</label>
                          <input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                        <div className="flex items-end sm:col-span-2 lg:col-span-1">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-700 p-2 w-full sm:w-auto flex items-center justify-center"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retention Fee */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900">Sicherheitseinbehalt</h3>
                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prozentsatz (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('retentionFee', { valueAsNumber: true })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Nettobetrag:</span>
                      <span>{subtotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MwSt.:</span>
                      <span>{tax.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Gesamtbetrag:</span>
                      <span>{total.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Sicherheitseinbehalt:</span>
                      <span>{retention.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Auszahlungsbetrag:</span>
                      <span>{(total - retention).toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Panel - Live Preview */}
        <div className="xl:sticky xl:top-4 xl:h-fit">
          <InvoiceLivePreview
            invoiceNumber={watch('invoiceNumber') || ''}
            date={watch('date') || ''}
            dueDate={watch('dueDate') || ''}
            type={watch('type') || 'Standard'}
            customerData={watch('customerData') || { name: '', address: '', taxId: '' }}
            items={watch('items') || []}
            retentionFee={watch('retentionFee') || 0}
            zoom={previewZoom}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onDownload={handleDownload}
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceFormEdit;