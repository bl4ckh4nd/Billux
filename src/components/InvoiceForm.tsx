import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Trash2, Search, Save, Send } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useInvoices, useCreateInvoice } from '../hooks/useInvoices';
import { useArticles } from '../hooks/useArticles';
import InvoiceLivePreview from './InvoiceLivePreview';
import type { Invoice } from '../types/invoice';
import { useTranslation } from 'react-i18next';

interface Article {
  id: string;
  name: string;
  description: string;
  unit: string;
  basePrice: number;
  category: string;
}

const createInvoiceSchema = (t: any) => z.object({
  invoiceNumber: z.string().min(1, t('invoice:validation.invoiceNumberRequired')),
  date: z.string(),
  dueDate: z.string(),
  type: z.enum(['Standard', 'Abschlag', 'Schlussrechnung']),
  projectId: z.string().optional(),
  customerData: z.object({
    name: z.string().min(1, t('customer:validation.nameRequired')),
    address: z.string().min(1, t('customer:validation.addressRequired')),
    taxId: z.string().min(1, t('customer:validation.taxIdRequired')),
  }),
  items: z.array(z.object({
    articleId: z.string(),
    description: z.string().min(1, t('invoice:validation.descriptionRequired')),
    quantity: z.number().min(0.01),
    unit: z.string().min(1, t('invoice:validation.unitRequired')),
    unitPrice: z.number().min(0.01),
    taxRate: z.number(),
  })),
  retentionFee: z.number().min(0).max(100),
});

const InvoiceForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { t } = useTranslation(['invoice', 'customer', 'common']);
  const invoiceSchema = createInvoiceSchema(t);
  type InvoiceFormData = z.infer<typeof invoiceSchema>;
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      type: 'Standard' as const,
      items: [],
      retentionFee: 5,
      customerData: {
        name: '',
        address: '',
        taxId: '',
      },
    },
  });

  const { mutate: createInvoice, isLoading: isCreating } = useCreateInvoice();
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
        inv => inv.projectId === watchProjectId && inv.type === 'Abschlag'
      );
      setPreviousInvoices(projectInvoices);
      setTotalPreviousAmount(
        projectInvoices.reduce((sum, inv) => sum + inv.amount, 0)
      );
    }
  }, [watchProjectId, allInvoices]);

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
      customerId: data.customerData.name, // Using name as customerId for now
      projectId: data.projectId,
      items: data.items.map(item => ({
        articleId: item.articleId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      dueDate: data.dueDate,
      retentionFee: data.retentionFee,
      type: data.type,
      previousInvoiceIds: previousInvoices.map(inv => inv.id)
    };

    createInvoice(invoiceData, {
      onSuccess: () => {
        setShowSuccessMessage(true);
        // Call the success callback after a short delay to show the success message
        setTimeout(() => {
          setShowSuccessMessage(false);
          onSuccess?.();
        }, 1500);
      },
      onError: (error) => {
        console.error('Failed to create invoice:', error);
        // You could add error state handling here if needed
      }
    });
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
    // TODO: Implement PDF download
    console.log('Download PDF');
  };

  const ArticleSelector = () => (
    <div className="absolute z-10 top-16 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder={t('article:filters.searchPlaceholder')}
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
            <span className="hidden sm:inline">{t('common:actions.save')}</span>
            <span className="sm:hidden">{t('common:status.draft')}</span>
          </button>
          <button
            type="submit"
            form="invoice-form"
            disabled={isCreating}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{isCreating ? t('common:messages.loading') : t('invoice:actions.send')}</span>
            <span className="sm:hidden">{t('invoice:actions.send')}</span>
          </button>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
          {t('invoice:messages.invoiceCreated')}
        </div>
      )}

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Panel - Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">{t('invoice:form.invoiceDetails')}</h2>
            
            <form id="invoice-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Invoice Details Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoice:form.invoiceNumber')}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoice:form.invoiceDate')}</label>
                    <input
                      type="date"
                      {...register('date')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoice:form.dueDate')}</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoice:form.invoiceType')}</label>
                  <select
                    {...register('type')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="Standard">{t('invoice:form.standardInvoice')}</option>
                    <option value="Abschlag">{t('invoice:form.downPaymentInvoice')}</option>
                    <option value="Schlussrechnung">{t('invoice:form.finalInvoice')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoice:form.project')}</label>
                  <select
                    {...register('projectId')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">{t('invoice:form.noProject')}</option>
                    {projects?.map(project => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
                </div>
              </div>

                {/* Previous Invoices (if applicable) */}
                {watchType !== 'Standard' && watchProjectId && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">{t('invoice:form.previousDownPayments')}</h3>
                    <div className="space-y-1">
                      {previousInvoices.length > 0 ? (
                        previousInvoices.map(invoice => (
                          <div key={invoice.id} className="flex justify-between py-1 text-sm">
                            <span>{invoice.number}</span>
                            <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(invoice.amount)}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">{t('invoice:form.noPreviousInvoices')}</p>
                      )}
                      
                      {watchType === 'Schlussrechnung' && (
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-medium text-sm">
                            <span>{t('invoice:form.totalPreviousDownPayments')}</span>
                            <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalPreviousAmount)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Data Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-gray-900">{t('invoice:form.recipient')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoice:form.name')}</label>
                      <input
                        {...register('customerData.name')}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder={t('invoice:form.companyOrPrivate')}
                      />
                      {errors.customerData?.name && (
                        <p className="text-red-600 text-sm mt-1">{errors.customerData.name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoice:form.taxNumber')}</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoice:form.address')}</label>
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
                    <h3 className="text-base font-semibold text-gray-900">{t('invoice:form.positions')}</h3>
                    <button
                      type="button"
                      onClick={addItem}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t('invoice:form.addPosition')}</span>
                    </button>
                  </div>

                  {showArticleSelector && <ArticleSelector />}

                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                          <div className="sm:col-span-2 lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoice:form.description')}</label>
                            <input
                              {...register(`items.${index}.description`)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoice:form.quantity')}</label>
                            <input
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoice:form.unit')}</label>
                            <input
                              {...register(`items.${index}.unit`)}
                              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoice:form.unitPrice')}</label>
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
                  <h3 className="text-base font-semibold text-gray-900">{t('invoice:form.retentionFeeSection')}</h3>
                  <div className="w-full md:w-1/2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('invoice:form.percentageRate')}</label>
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
                        <span>{t('common:summary.netAmount')}</span>
                        <span>{subtotal.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('common:summary.vat')}</span>
                        <span>{tax.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>{t('common:summary.totalAmount')}</span>
                        <span>{total.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>{t('common:summary.retentionFee')}</span>
                        <span>{retention.toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>{t('common:summary.payoutAmount')}</span>
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

export default InvoiceForm;