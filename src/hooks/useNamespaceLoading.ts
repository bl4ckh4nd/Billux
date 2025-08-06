import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loadNamespace } from '../lib/i18n';

interface UseNamespaceLoadingOptions {
  namespaces: string[];
  language?: string;
  preload?: boolean;
}

export const useNamespaceLoading = ({ 
  namespaces, 
  language = 'de', 
  preload = false 
}: UseNamespaceLoadingOptions) => {
  const [loadedNamespaces, setLoadedNamespaces] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const { i18n } = useTranslation();

  const loadNamespaces = async (namespacesToLoad: string[]) => {
    setLoading(true);
    
    try {
      const promises = namespacesToLoad.map(async (namespace) => {
        // Check if namespace is already loaded
        if (i18n.hasResourceBundle(language, namespace)) {
          return namespace;
        }
        
        await loadNamespace(namespace, language);
        return namespace;
      });
      
      const loaded = await Promise.all(promises);
      setLoadedNamespaces(prev => new Set([...prev, ...loaded]));
    } catch (error) {
      console.error('Failed to load namespaces:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load namespaces on mount if preload is enabled
  useEffect(() => {
    if (preload && namespaces.length > 0) {
      loadNamespaces(namespaces);
    }
  }, [preload, language]);

  // Check if all required namespaces are loaded
  const areNamespacesLoaded = namespaces.every(ns => 
    loadedNamespaces.has(ns) || i18n.hasResourceBundle(language, ns)
  );

  return {
    loadNamespaces,
    areNamespacesLoaded,
    loading,
    loadedNamespaces: Array.from(loadedNamespaces),
  };
};

// Hook for route-based namespace loading
export const useRouteNamespaces = (route: string) => {
  const routeNamespaceMap: Record<string, string[]> = {
    'invoice': ['invoice', 'customer', 'common'],
    'invoice-new': ['invoice', 'customer', 'article', 'common'],
    'invoice-edit': ['invoice', 'customer', 'article', 'common'],
    'invoice-detail': ['invoice', 'customer', 'payment', 'common'],
    'invoice-upload': ['invoice', 'customer', 'common'],
    'customers': ['customer', 'common'],
    'customer-detail': ['customer', 'invoice', 'payment', 'common'],
    'articles': ['article', 'common'],
    'article-detail': ['article', 'invoice', 'common'],
    'projects': ['project', 'customer', 'common'],
    'project-detail': ['project', 'customer', 'invoice', 'common'],
    'finances': ['analytics', 'payment', 'invoice', 'common'],
    'reminders': ['payment', 'invoice', 'customer', 'common'],
    'settings': ['common'],
    'dashboard': ['analytics', 'invoice', 'customer', 'project', 'common'],
  };

  const namespaces = routeNamespaceMap[route] || ['common'];
  
  return useNamespaceLoading({ 
    namespaces, 
    preload: true 
  });
};

export default useNamespaceLoading;