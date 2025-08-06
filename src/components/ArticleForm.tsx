import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Package, Euro, Info, Settings } from 'lucide-react';
import { useCreateArticle, useUpdateArticle } from '../hooks/useArticles';
import type { Article } from '../types/article';

interface ArticleFormProps {
  article?: Article | null;
  onClose: () => void;
}

interface ArticleFormData {
  name: string;
  description: string;
  unit: string;
  basePrice: number;
  category: string;
  isActive: boolean;
  stock: number;
  minStock: number;
  taxRate: number;
  notes: string;
}

const predefinedCategories = [
  'Malerarbeiten',
  'Tapezierarbeiten', 
  'Bodenarbeiten',
  'Beratung',
  'Material',
  'Werkzeug',
  'Sonstiges'
];

const predefinedUnits = [
  'm²',
  'Stunde',
  'kg',
  'Liter',
  'Stück',
  'Meter',
  'Pauschal'
];

export const ArticleForm: React.FC<ArticleFormProps> = ({ article, onClose }) => {
  const isEditMode = !!article;
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<ArticleFormData>({
    defaultValues: isEditMode ? {
      name: article.name,
      description: article.description,
      unit: article.unit,
      basePrice: article.basePrice,
      category: article.category,
      isActive: article.isActive !== false,
      stock: article.stock || 0,
      minStock: article.minStock || 0,
      taxRate: article.taxRate || 19,
      notes: article.notes || ''
    } : {
      isActive: true,
      stock: 0,
      minStock: 0,
      taxRate: 19,
      notes: ''
    }
  });
  
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();

  const onSubmit = (data: ArticleFormData) => {
    if (isEditMode && article) {
      updateArticle.mutate({
        id: article.id,
        data: {
          ...data,
          updatedAt: new Date().toISOString()
        }
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    } else {
      createArticle.mutate({
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  const unit = watch('unit');

  const isServiceUnit = unit === 'Stunde' || unit === 'Pauschal';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? `Artikel bearbeiten: ${article.name}` : 'Neuen Artikel erstellen'}
            </h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
          {/* Basic Information Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <Info className="w-5 h-5 mr-2 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Grundinformationen</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  {...register('name', { required: 'Name ist erforderlich' })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  placeholder="z.B. Malerarbeiten Standard"
                />
                {errors.name && <span className="text-sm text-red-600 mt-1">{errors.name.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie *</label>
                <select
                  {...register('category', { required: 'Kategorie ist erforderlich' })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                >
                  <option value="">Kategorie wählen</option>
                  {predefinedCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <span className="text-sm text-red-600 mt-1">{errors.category.message}</span>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung *</label>
                <textarea
                  {...register('description', { required: 'Beschreibung ist erforderlich' })}
                  rows={3}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  placeholder="Detaillierte Beschreibung des Artikels..."
                />
                {errors.description && <span className="text-sm text-red-600 mt-1">{errors.description.message}</span>}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Artikel ist aktiv</span>
                </label>
              </div>
            </div>
          </div>

          {/* Pricing & Unit Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <Euro className="w-5 h-5 mr-2 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Preise & Einheiten</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Einheit *</label>
                <select
                  {...register('unit', { required: 'Einheit ist erforderlich' })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                >
                  <option value="">Einheit wählen</option>
                  {predefinedUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                {errors.unit && <span className="text-sm text-red-600 mt-1">{errors.unit.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grundpreis * (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('basePrice', { 
                    required: 'Grundpreis ist erforderlich', 
                    min: { value: 0, message: 'Preis muss positiv sein' },
                    valueAsNumber: true
                  })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  placeholder="0.00"
                />
                {errors.basePrice && <span className="text-sm text-red-600 mt-1">{errors.basePrice.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Steuersatz (%)</label>
                <select
                  {...register('taxRate', { valueAsNumber: true })}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                >
                  <option value="0">0% (steuerfrei)</option>
                  <option value="7">7% (ermäßigt)</option>
                  <option value="19">19% (regulär)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Inventory Section - Only for physical items */}
          {!isServiceUnit && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <Package className="w-5 h-5 mr-2 text-teal-600" />
                <h3 className="text-lg font-semibold text-gray-900">Lagerbestand</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aktueller Bestand</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    {...register('stock', { 
                      min: { value: 0, message: 'Bestand muss positiv sein' },
                      valueAsNumber: true
                    })}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    placeholder="0"
                  />
                  {errors.stock && <span className="text-sm text-red-600 mt-1">{errors.stock.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mindestbestand</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    {...register('minStock', { 
                      min: { value: 0, message: 'Mindestbestand muss positiv sein' },
                      valueAsNumber: true
                    })}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    placeholder="0"
                  />
                  {errors.minStock && <span className="text-sm text-red-600 mt-1">{errors.minStock.message}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 mr-2 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">Zusätzliche Informationen</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                placeholder="Zusätzliche Hinweise oder Bemerkungen..."
              />
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
              disabled={createArticle.isLoading || updateArticle.isLoading}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {createArticle.isLoading || updateArticle.isLoading ? 'Speichere...' : 
               isEditMode ? 'Änderungen speichern' : 'Artikel erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
