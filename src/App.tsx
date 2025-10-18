import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider, useTranslation } from 'react-i18next';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Finance from './components/Finance';
import SettingsForm from './components/settings/SettingsForm';
import { useUIStore } from './stores/uiStore';
import { useRouteNamespaces } from './hooks/useNamespaceLoading';
import i18n from './lib/i18n';
import DashboardRoute from './routes/DashboardRoute';
import InvoiceOverviewRoute from './routes/InvoiceOverviewRoute';
import InvoiceCreateRoute from './routes/InvoiceCreateRoute';
import InvoiceAddRoute from './routes/InvoiceAddRoute';
import InvoiceDetailRoute from './routes/InvoiceDetailRoute';
import InvoiceEditRoute from './routes/InvoiceEditRoute';
import InvoiceUploadRoute from './routes/InvoiceUploadRoute';
import CustomerListRoute from './routes/CustomerListRoute';
import CustomerDetailRoute from './routes/CustomerDetailRoute';
import ArticleListRoute from './routes/ArticleListRoute';
import ArticleDetailRoute from './routes/ArticleDetailRoute';
import ProjectListRoute from './routes/ProjectListRoute';
import ProjectDetailRoute from './routes/ProjectDetailRoute';
import RemindersRoute from './routes/RemindersRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});

const getRouteKey = (pathname: string): string => {
  if (pathname.startsWith('/invoices/upload')) return 'invoice-upload';
  if (pathname.startsWith('/invoices/new')) return 'invoice-new';
  if (pathname.startsWith('/invoices/') && pathname.endsWith('/edit')) return 'invoice-edit';
  if (pathname.startsWith('/invoices/')) return 'invoice-detail';
  if (pathname.startsWith('/invoices')) return 'invoice';
  if (pathname.startsWith('/customers/')) return 'customer-detail';
  if (pathname.startsWith('/customers')) return 'customers';
  if (pathname.startsWith('/articles/')) return 'article-detail';
  if (pathname.startsWith('/articles')) return 'articles';
  if (pathname.startsWith('/projects/')) return 'project-detail';
  if (pathname.startsWith('/projects')) return 'projects';
  if (pathname.startsWith('/finances')) return 'finances';
  if (pathname.startsWith('/reminders')) return 'reminders';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'dashboard';
};

const getPageTitle = (pathname: string, t: (key: string) => string): string => {
  if (pathname.startsWith('/invoices/upload')) return t('pageTitle.invoiceUpload');
  if (pathname.startsWith('/invoices')) return t('pageTitle.invoices');
  if (pathname.startsWith('/customers')) return t('pageTitle.customers');
  if (pathname.startsWith('/articles')) return t('pageTitle.articles');
  if (pathname.startsWith('/projects')) return t('pageTitle.projects');
  if (pathname.startsWith('/reminders')) return t('pageTitle.reminders');
  if (pathname.startsWith('/finances')) return t('pageTitle.finances');
  if (pathname.startsWith('/settings')) return t('pageTitle.settings');
  return t('pageTitle.dashboard');
};

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('navigation');
  const routeKey = getRouteKey(location.pathname);
  const { areNamespacesLoaded, loading } = useRouteNamespaces(routeKey);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
        <Sidebar onNavigate={handleNavigate} currentPath={location.pathname} />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          currentPage={getPageTitle(location.pathname, t)}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6">
          {loading && !areNamespacesLoaded ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading translations...</p>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

function App() {
  const { preferences } = useUIStore();
  const { i18n: translationI18n } = useTranslation('navigation');

  useEffect(() => {
    if (translationI18n && translationI18n.language !== preferences.language) {
      translationI18n.changeLanguage(preferences.language);
    }
  }, [preferences.language, translationI18n]);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardRoute />} />
              <Route path="invoices">
                <Route index element={<InvoiceOverviewRoute />} />
                <Route path="new" element={<InvoiceCreateRoute />} />
                <Route path="add" element={<InvoiceAddRoute />} />
                <Route path="upload" element={<InvoiceUploadRoute />} />
                <Route path=":invoiceId">
                  <Route index element={<InvoiceDetailRoute />} />
                  <Route path="edit" element={<InvoiceEditRoute />} />
                </Route>
              </Route>
              <Route path="customers">
                <Route index element={<CustomerListRoute />} />
                <Route path=":customerId" element={<CustomerDetailRoute />} />
              </Route>
              <Route path="articles">
                <Route index element={<ArticleListRoute />} />
                <Route path=":articleId" element={<ArticleDetailRoute />} />
              </Route>
              <Route path="projects">
                <Route index element={<ProjectListRoute />} />
                <Route path=":projectId" element={<ProjectDetailRoute />} />
              </Route>
              <Route path="reminders" element={<RemindersRoute />} />
              <Route path="finances" element={<Finance />} />
              <Route path="settings" element={<SettingsForm />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
