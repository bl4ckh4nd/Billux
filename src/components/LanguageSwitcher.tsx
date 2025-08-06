import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../stores/uiStore';
import { supportedLanguages } from '../types/i18n';
import type { SupportedLanguage } from '../types/i18n';

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const { preferences, setLanguage } = useUIStore();

  const handleLanguageChange = async (language: SupportedLanguage) => {
    try {
      // Update UI store first
      setLanguage(language);
      
      // Then change i18n language
      await i18n.changeLanguage(language);
      
      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Language changed to:', language, 'i18n resolved language:', i18n.resolvedLanguage);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        <Globe className="h-4 w-4 text-gray-500" />
        <select
          value={preferences.language}
          onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
          className="bg-transparent border-none text-sm text-gray-700 focus:outline-none focus:ring-0 cursor-pointer"
        >
          {Object.entries(supportedLanguages).map(([code, language]) => (
            <option key={code} value={code}>
              {language.flag} {language.nativeName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LanguageSwitcher;