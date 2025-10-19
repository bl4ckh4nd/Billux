import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, UIMatch, useMatches, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider, useTranslation } from 'react-i18next';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { useUIStore } from './stores/uiStore';
import { useRouteNamespaces } from './hooks/useNamespaceLoading';
import i18n from './lib/i18n';
import { NAVIGATION_PATHS, NavKey } from './routes/navKeys';
import type { AppRouteHandle } from './routes/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
  },
});

const DEFAULT_TITLE = 'Billux';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { preferences } = useUIStore();
  const { t, i18n: translationI18n } = useTranslation('navigation');
  const matches = useMatches() as UIMatch<unknown, AppRouteHandle>[];
  const navigate = useNavigate();

  const activeHandle = (matches[matches.length - 1]?.handle ?? {}) as Partial<AppRouteHandle>;
  const activeNavKey: NavKey = activeHandle.navKey ?? 'dashboard';
  const pageTitle = activeHandle.titleKey ? t(activeHandle.titleKey) : DEFAULT_TITLE;

  const { areNamespacesLoaded, loading } = useRouteNamespaces(
    activeHandle.namespaceKey ?? activeHandle.navKey
  );

  useEffect(() => {
    if (translationI18n && translationI18n.language !== preferences.language) {
      translationI18n.changeLanguage(preferences.language);
    }
  }, [preferences.language, translationI18n]);

  const handleNavigate = useCallback(
    (key: NavKey) => {
      const targetPath = NAVIGATION_PATHS[key];
      if (!targetPath) {
        return;
      }

      navigate(targetPath);
      setIsSidebarOpen(false);
    },
    [navigate]
  );

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          {/* Sidebar */}
          <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
            <Sidebar onNavigate={handleNavigate} currentView={activeNavKey} />
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
