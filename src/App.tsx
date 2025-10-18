import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider, useTranslation } from 'react-i18next';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { useUIStore } from './stores/uiStore';
import { useRouteNamespaces } from './hooks/useNamespaceLoading';
import i18n from './lib/i18n';
import { useLayoutStore } from './stores/layoutStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});

function App() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { preferences } = useUIStore();
  const { pageMeta } = useLayoutStore();
  const { i18n: translationI18n } = useTranslation('navigation');

  const namespaceKey = pageMeta.namespaceKey ?? 'dashboard';
  const { areNamespacesLoaded, loading } = useRouteNamespaces(namespaceKey);

  useEffect(() => {
    if (translationI18n && translationI18n.language !== preferences.language) {
      translationI18n.changeLanguage(preferences.language);
    }
  }, [preferences.language, translationI18n]);

  const pageTitle = useMemo(() => {
    if (!pageMeta.titleKey) {
      return 'Billux';
    }

    return translationI18n?.t(pageMeta.titleKey) ?? 'Billux';
  }, [pageMeta.titleKey, translationI18n]);

  const handleSidebarNavigate = (path: string) => {
    navigate({ to: path as any });
    setIsSidebarOpen(false);
  };

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          {/* Sidebar */}
          <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
            <Sidebar onNavigate={handleSidebarNavigate} currentKey={pageMeta.navKey ?? ''} />
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
              currentPage={pageTitle}
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
                <Outlet />
              )}
            </main>
          </div>
        </div>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

export default App;
