import React, { useState } from 'react';
import {
  ArrowLeft,
  Package,
  Euro,
  Tag,
  BarChart3,
  TrendingUp,
  Clock,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  FileText,
  Users,
  Activity,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';
import { useArticle } from '../hooks/useArticle';
import { useArticleInvoices } from '../hooks/useArticleInvoices';
import { useArticleUsageStats } from '../hooks/useArticleUsageStats';
import { useDeleteArticle, useUpdateArticle } from '../hooks/useArticles';
import { ArticleForm } from './ArticleForm';

interface ArticleDetailProps {
  articleId: string;
  onBack: () => void;
  onInvoiceClick?: (invoiceId: string) => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({
  articleId,
  onBack,
  onInvoiceClick
}) => {
  const [activeTab, setActiveTab] = useState('usage');
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Data hooks
  const { data: article, isLoading } = useArticle(articleId);
  const { data: invoices = [] } = useArticleInvoices(articleId);
  const { data: usageStats } = useArticleUsageStats(articleId);

  // Mutations
  const deleteArticle = useDeleteArticle();
  const updateArticle = useUpdateArticle();

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="text-center text-gray-500">Artikel nicht gefunden</div>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteArticle.mutateAsync(articleId);
      onBack();
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const handleToggleActive = async () => {
    try {
      await updateArticle.mutateAsync({
        id: articleId,
        data: { isActive: !article.isActive }
      });
    } catch (error) {
      console.error('Error updating article:', error);
    }
  };

  const handleDuplicate = () => {
    // TODO: Implement article duplication
    console.log('Duplicate article:', article);
  };

  const isLowStock = article.stock !== undefined && 
                     article.minStock !== undefined && 
                     article.stock <= article.minStock;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{article.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  article.category === 'Malerarbeiten' ? 'bg-blue-100 text-blue-800' :
                  article.category === 'Tapezierarbeiten' ? 'bg-purple-100 text-purple-800' :
                  article.category === 'Bodenarbeiten' ? 'bg-green-100 text-green-800' :
                  article.category === 'Beratung' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {article.category}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  article.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {article.isActive ? <Check className="w-4 h-4 mr-1" /> : <X className="w-4 h-4 mr-1" />}
                  {article.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              <p className="text-gray-600 mt-1">{article.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleActive}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                article.isActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {article.isActive ? 'Deaktivieren' : 'Aktivieren'}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                  <button
                    onClick={() => {
                      setShowEditForm(true);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Bearbeiten
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Duplizieren
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Löschen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Article Information Card */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Package className="w-5 h-5 mr-2 text-teal-600" />
              Artikelinformationen
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Einheit:</span>
                <span className="font-medium">{article.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Steuersatz:</span>
                <span className="font-medium">{article.taxRate || 19}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Erstellt am:</span>
                <span className="font-medium">
                  {article.createdAt ? new Date(article.createdAt).toLocaleDateString('de-DE') : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Letzte Änderung:</span>
                <span className="font-medium">
                  {article.updatedAt ? new Date(article.updatedAt).toLocaleDateString('de-DE') : '-'}
                </span>
              </div>
              {article.notes && (
                <div className="pt-2 border-t">
                  <p className="text-gray-600">Notizen:</p>
                  <p className="font-medium text-gray-800 mt-1">{article.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Inventory Card */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Euro className="w-5 h-5 mr-2 text-teal-600" />
              Preise & Lagerbestand
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Basispreis:</span>
                <span className="font-semibold text-lg">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(article.basePrice)}
                </span>
              </div>
              {article.unit !== 'Stunde' && article.unit !== 'Pauschal' && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lagerbestand:</span>
                    <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                      {article.stock || 0} {article.unit}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mindestbestand:</span>
                    <span className="font-medium">{article.minStock || 0} {article.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lagerwert:</span>
                    <span className="font-medium text-green-600">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(article.stockValue || 0)}
                    </span>
                  </div>
                  {isLowStock && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        <span className="text-xs font-medium">Niedriger Lagerbestand</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Usage Statistics Card */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-teal-600" />
              Nutzungsstatistiken
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Verwendungen:</span>
                <span className="font-semibold text-lg">{article.usageCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gesamtumsatz:</span>
                <span className="font-medium text-green-600">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(article.totalRevenue || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ø Menge:</span>
                <span className="font-medium">
                  {(article.averageQuantity || 0).toFixed(1)} {article.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Zuletzt verwendet:</span>
                <span className="font-medium">
                  {article.lastUsedDate ? new Date(article.lastUsedDate).toLocaleDateString('de-DE') : 'Nie'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b">
          <nav className="flex -mb-px">
            {[
              { id: 'usage', label: 'Nutzungsverlauf', icon: Activity },
              { id: 'invoices', label: 'Rechnungen', icon: FileText },
              { id: 'price', label: 'Preisverlauf', icon: TrendingUp },
              { id: 'customers', label: 'Top Kunden', icon: Users },
              { id: 'activity', label: 'Aktivität', icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center ${
                    activeTab === tab.id
                      ? 'border-teal-600 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'usage' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Monatliche Nutzung</h3>
              {usageStats && usageStats.monthlyUsage.length > 0 ? (
                <div className="space-y-4">
                  {/* Monthly usage chart would go here */}
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    {usageStats.monthlyUsage.map((month) => (
                      <div key={month.month} className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600">{month.month}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{month.count}</p>
                        <p className="text-sm text-green-600 mt-1">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(month.revenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Keine Nutzungsdaten vorhanden</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Verwendung in Rechnungen</h3>
              {invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rechnungsnr.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Datum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kunde
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Menge
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Summe
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => onInvoiceClick?.(invoice.id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(invoice.date).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.customer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Math.floor(Math.random() * 10) + 1} {article.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(
                              (Math.floor(Math.random() * 10) + 1) * article.basePrice
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Noch nicht in Rechnungen verwendet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'price' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Preisentwicklung</h3>
              {usageStats && usageStats.priceHistory.length > 0 ? (
                <div className="space-y-4">
                  {/* Price chart would go here */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Datum
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Preis
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Änderung
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {usageStats.priceHistory.map((entry, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(entry.date).toLocaleDateString('de-DE')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(entry.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`inline-flex items-center ${
                                entry.change > 0 ? 'text-green-600' : entry.change < 0 ? 'text-red-600' : 'text-gray-500'
                              }`}>
                                {entry.change > 0 ? '+' : ''}{entry.change.toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Keine Preishistorie vorhanden</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'customers' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Top Kunden</h3>
              {usageStats && usageStats.topCustomers.length > 0 ? (
                <div className="space-y-4">
                  {usageStats.topCustomers.map((customer, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{customer.customerName}</p>
                        <p className="text-sm text-gray-600">
                          {customer.usageCount} Verwendungen
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(customer.totalRevenue)}
                        </p>
                        <p className="text-sm text-gray-600">Gesamtumsatz</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Keine Kundendaten vorhanden</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Aktivitätsverlauf</h3>
              {/* Activity timeline would go here */}
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aktivitätsverlauf wird hier angezeigt</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Artikel löschen</h3>
            <p className="mb-6">
              Sind Sie sicher, dass Sie den Artikel "{article.name}" löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <ArticleForm
          article={article}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
};

export default ArticleDetail;