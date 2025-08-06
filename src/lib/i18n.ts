import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// import LanguageDetector from 'i18next-browser-languagedetector'; // Removed to avoid conflicts with UI store

// Import essential translations that are always needed
import commonDE from '../locales/de/common.json';
import navigationDE from '../locales/de/navigation.json';
import commonEN from '../locales/en/common.json';
import navigationEN from '../locales/en/navigation.json';

// Essential resources that are always loaded
const resources = {
  de: {
    common: commonDE,
    navigation: navigationDE,
  },
  en: {
    common: commonEN,
    navigation: navigationEN,
  },
};

// Lazy loading function for namespaces
export const loadNamespace = async (namespace: string, language: string = 'de') => {
  try {
    const translations = await import(`../locales/${language}/${namespace}.json`);
    i18n.addResourceBundle(language, namespace, translations.default, true, true);
    return translations.default;
  } catch (error) {
    console.error(`Failed to load namespace ${namespace} for language ${language}:`, error);
    return {};
  }
};

// Preload function for critical namespaces
export const preloadNamespaces = async (namespaces: string[], language: string = 'de') => {
  const promises = namespaces.map(ns => loadNamespace(ns, language));
  await Promise.all(promises);
};

// Initialize i18n synchronously
i18n
  .use(initReactI18next) // Remove LanguageDetector to avoid conflicts with UI store
  .init({
    resources,
    
    // Default language
    fallbackLng: 'de',
    lng: 'de', // German as default for business compliance
    
    // Namespaces - only essential ones are loaded initially
    defaultNS: 'common',
    ns: ['common', 'navigation'],
    
    // Language detection disabled - managed by UI store
    // detection: {
    //   order: ['localStorage', 'navigator', 'htmlTag'],
    //   caches: ['localStorage'],
    // },
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React-specific options
    react: {
      useSuspense: false, // Disable suspense for React 19 compatibility
      bindI18n: 'languageChanged', // Re-render on language change
      bindI18nStore: 'added removed', // Re-render on resource changes
      transEmptyNodeValue: '', // Value for empty trans nodes
      transSupportBasicHtmlNodes: true, // Allow basic HTML nodes
      transWrapTextNodes: '',
    },
    
    // Performance options
    load: 'languageOnly', // Load only language, not region variants
    preload: ['de', 'en'], // Preload German and English
    
    // Cache configuration (5 minutes to align with TanStack Query)
    cache: {
      enabled: true,
      expirationTime: 5 * 60 * 1000, // 5 minutes
    },
    
    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
    
    // Synchronous initialization to avoid hook timing issues
    initImmediate: false,
    
    // Ensure resources are always available
    returnEmptyString: false,
    returnNull: false,
  });

// Add debug logging for language changes in development
if (process.env.NODE_ENV === 'development') {
  i18n.on('languageChanged', (lng) => {
    console.log('i18n: Language changed to:', lng);
  });
  
  i18n.on('loaded', (loaded) => {
    console.log('i18n: Resources loaded:', Object.keys(loaded));
  });
  
  i18n.on('added', (lng, ns) => {
    console.log('i18n: Resource added:', lng, ns);
  });
}

export default i18n;