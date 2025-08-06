import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook to force re-renders when language changes
 * Useful for components that need to update when translations change
 */
export const useLanguageUpdate = () => {
  const { i18n } = useTranslation();
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const handleLanguageChange = () => {
      // Force re-render by updating state
      forceUpdate({});
    };

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);

    // Cleanup listener
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return i18n.language;
};