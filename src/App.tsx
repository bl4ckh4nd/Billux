import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoiceOverview from './components/InvoiceOverview';
import InvoiceDetail from './components/InvoiceDetailNew';
import InvoiceAdd from './components/InvoiceAdd';
import InvoiceEdit from './components/InvoiceEdit';
import InvoiceUploadPage from './components/InvoiceUploadPage';
import CustomerDatabase from './components/CustomerDatabase';
import CustomerDetail from './components/CustomerDetail';
import ArticleCatalog from './components/ArticleCatalog';
import ArticleDetail from './components/ArticleDetail';
import ProjectOverview from './components/ProjectOverview';
import ProjectDetail from './components/ProjectDetail';
import Reminders from './components/Reminders';
import Finance from './components/Finance';
import SettingsForm from './components/settings/SettingsForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation, I18nextProvider } from 'react-i18next';
import { useUIStore } from './stores/uiStore';
import { useRouteNamespaces } from './hooks/useNamespaceLoading';
import i18n from './lib/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'invoice' | 'invoice-new' | 'invoice-add' | 'invoice-edit' | 'invoice-detail' | 'invoice-upload' | 'customers' | 'customer-detail' | 'articles' | 'article-detail' | 'finances' | 'projects' | 'project-detail' | 'reminders' | 'settings'>('dashboard');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // i18n is already initialized before this component renders
  const { preferences } = useUIStore();
  const { t, i18n: translationI18n } = useTranslation('navigation');
  const { areNamespacesLoaded, loading } = useRouteNamespaces(currentView);

  // Sync i18n language with UI store preferences
  useEffect(() => {
    if (translationI18n && translationI18n.language !== preferences.language) {
      translationI18n.changeLanguage(preferences.language);
    }
  }, [preferences.language, translationI18n]);

  const handleInvoiceClick = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setCurrentView('invoice-detail');
  };

  const handleCustomerClick = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setCurrentView('customer-detail');
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project-detail');
  };

  const handleArticleClick = (articleId: string) => {
    setSelectedArticleId(articleId);
    setCurrentView('article-detail');
  };

  const handleInvoiceEdit = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setCurrentView('invoice-edit');
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard': return t('pageTitle.dashboard');
      case 'invoice': return t('pageTitle.invoices');
      case 'invoice-new': return t('pageTitle.invoices');
      case 'invoice-add': return t('pageTitle.invoices');
      case 'invoice-edit': return t('pageTitle.invoices');
      case 'invoice-detail': return t('pageTitle.invoices');
      case 'invoice-upload': return t('pageTitle.invoiceUpload');
      case 'customers': return t('pageTitle.customers');
      case 'customer-detail': return t('pageTitle.customers');
      case 'articles': return t('pageTitle.articles');
      case 'article-detail': return t('pageTitle.articles');
      case 'finances': return t('pageTitle.finances');
      case 'projects': return t('pageTitle.projects');
      case 'project-detail': return t('pageTitle.projects');
      case 'reminders': return t('pageTitle.reminders');
      case 'settings': return t('pageTitle.settings');
      default: return 'Billux';
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'invoice-new':
        return <InvoiceForm />;
      case 'invoice-add':
        return <InvoiceAdd onBack={() => setCurrentView('invoice')} />;
      case 'invoice-edit':
        return selectedInvoiceId ? (
          <InvoiceEdit
            invoiceId={selectedInvoiceId}
            onBack={() => setCurrentView('invoice-detail')}
          />
        ) : null;
      case 'invoice':
        return <InvoiceOverview onInvoiceClick={handleInvoiceClick} />;
      case 'invoice-upload':
        return <InvoiceUploadPage onBack={() => setCurrentView('invoice')} />;
      case 'invoice-detail':
        return selectedInvoiceId ? (
          <InvoiceDetail
            invoiceId={selectedInvoiceId}
            onBack={() => setCurrentView('invoice')}
            onCustomerClick={handleCustomerClick}
            onProjectClick={handleProjectClick}
            onEditClick={handleInvoiceEdit}
          />
        ) : null;
      case 'customers':
        return <CustomerDatabase onCustomerClick={handleCustomerClick} />;
      case 'customer-detail':
        return selectedCustomerId ? (
          <CustomerDetail 
            customerId={selectedCustomerId}
            onBack={() => setCurrentView('customers')}
          />
        ) : null;
      case 'articles':
        return <ArticleCatalog onArticleClick={handleArticleClick} />;
      case 'article-detail':
        return selectedArticleId ? (
          <ArticleDetail 
            articleId={selectedArticleId}
            onBack={() => setCurrentView('articles')}
            onInvoiceClick={handleInvoiceClick}
          />
        ) : null;
      case 'projects':
        return <ProjectOverview onProjectClick={handleProjectClick} />;
      case 'project-detail':
        return selectedProjectId ? (
          <ProjectDetail 
            projectId={selectedProjectId}
            onBack={() => setCurrentView('projects')}
            onCustomerClick={handleCustomerClick}
          />
        ) : null;
      case 'reminders':
        return <Reminders onInvoiceClick={handleInvoiceClick} />;
      case 'finances':
        return <Finance />;
      case 'settings':
        return <SettingsForm />;
      default:
        return <Dashboard onNavigate={setCurrentView} onInvoiceClick={handleInvoiceClick} />;
    }
  };

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
          <Sidebar onNavigate={setCurrentView} currentView={currentView} />
        </div>
        
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header 
            onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            currentPage={getPageTitle()}
          />
          
          {/* Main content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
            {loading && !areNamespacesLoaded ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading translations...</p>
                </div>
              </div>
            ) : (
              renderContent()
            )}
          </main>
        </div>
      </div>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;