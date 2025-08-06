import React, { useState, useMemo } from 'react';
import { Plus, Package, BarChart3, Euro, Tag } from 'lucide-react';
import { useArticles, useDeleteArticle } from '../hooks/useArticles';
import { ArticleTable } from './ArticleTable';
import { ArticleForm } from './ArticleForm';
import type { Article } from '../types/article';

interface ArticleCatalogProps {
  onArticleClick?: (articleId: string) => void;
}

const ArticleCatalog: React.FC<ArticleCatalogProps> = ({ onArticleClick }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const { data: articles = [], isLoading } = useArticles();
  const deleteArticle = useDeleteArticle();

  const stats = useMemo(() => {
    const totalValue = articles.reduce((sum, article) => 
      sum + (article.basePrice * (article.stock || 0)), 0
    );
    
    const categories = new Set(articles.map(a => a.category));
    const lowStockItems = articles.filter(a => 
      a.stock !== undefined && a.minStock !== undefined && a.stock <= a.minStock
    ).length;

    return {
      totalArticles: articles.length,
      totalCategories: categories.size,
      totalValue,
      lowStockItems,
    };
  }, [articles]);

  const handleViewDetails = (article: Article) => {
    if (onArticleClick) {
      onArticleClick(article.id);
    }
  };

  const handleEdit = (article: Article) => {
    setSelectedArticle(article);
    setShowForm(true);
  };

  const handleDelete = async (article: Article) => {
    if (window.confirm(`Möchten Sie den Artikel "${article.name}" wirklich löschen?`)) {
      try {
        await deleteArticle.mutateAsync(article.id);
      } catch (error) {
        console.error('Failed to delete article:', error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedArticle(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Artikel gesamt</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalArticles}</p>
              <p className="text-xs text-gray-500 mt-1">Aktive Artikel</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Kategorien</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalCategories}</p>
              <p className="text-xs text-gray-500 mt-1">Verschiedene Kategorien</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Tag className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lagerwert</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(stats.totalValue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Gesamtwert</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Euro className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Niedriger Bestand</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.lowStockItems}</p>
              <p className="text-xs text-gray-500 mt-1">Artikel nachbestellen</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Artikelkatalog</h2>
              <p className="text-sm text-gray-600 mt-1">
                Verwalten Sie Ihre Artikel und Dienstleistungen
              </p>
            </div>
            <button 
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Neuer Artikel
            </button>
          </div>
        </div>

        <div className="p-6">
          <ArticleTable
            articles={articles}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {showForm && (
        <ArticleForm 
          article={selectedArticle} 
          onClose={handleCloseForm} 
        />
      )}
    </div>
  );
};

export default ArticleCatalog;