import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import type { SupportedLanguage, DateFormatOptions, NumberFormatOptions } from '../types/i18n';

// Locale mapping for date-fns
const localeMap = {
  de: de,
  en: enUS,
};

// Translation hook with namespace support
export const useI18n = (namespace?: string) => {
  const { t, i18n } = useTranslation(namespace);
  
  const currentLanguage = i18n.language as SupportedLanguage;
  const currentLocale = localeMap[currentLanguage];
  
  return {
    t,
    i18n,
    currentLanguage,
    currentLocale,
    isRTL: false, // Neither German nor English are RTL
  };
};

// Date formatting utilities
export const formatDate = (
  date: Date | string | number,
  options: DateFormatOptions = {},
  language: SupportedLanguage = 'de'
): string => {
  const dateObj = new Date(date);
  const locale = localeMap[language];
  
  // Use custom format if provided
  if (options.format) {
    return format(dateObj, options.format, { locale });
  }
  
  // Use Intl.DateTimeFormat for internationalization
  const formatOptions: Intl.DateTimeFormatOptions = {
    dateStyle: options.dateStyle || 'medium',
    timeStyle: options.timeStyle,
  };
  
  const localeString = language === 'de' ? 'de-DE' : 'en-US';
  return new Intl.DateTimeFormat(localeString, formatOptions).format(dateObj);
};

// Currency formatting utilities
export const formatCurrency = (
  amount: number,
  options: NumberFormatOptions = {},
  language: SupportedLanguage = 'de'
): string => {
  const localeString = language === 'de' ? 'de-DE' : 'en-US';
  const currency = options.currency || (language === 'de' ? 'EUR' : 'USD');
  
  return new Intl.NumberFormat(localeString, {
    style: 'currency',
    currency,
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(amount);
};

// Number formatting utilities
export const formatNumber = (
  value: number,
  options: NumberFormatOptions = {},
  language: SupportedLanguage = 'de'
): string => {
  const localeString = language === 'de' ? 'de-DE' : 'en-US';
  
  return new Intl.NumberFormat(localeString, {
    style: options.style || 'decimal',
    minimumFractionDigits: options.minimumFractionDigits,
    maximumFractionDigits: options.maximumFractionDigits,
  }).format(value);
};

// Percentage formatting utilities
export const formatPercent = (
  value: number,
  options: NumberFormatOptions = {},
  language: SupportedLanguage = 'de'
): string => {
  const localeString = language === 'de' ? 'de-DE' : 'en-US';
  
  return new Intl.NumberFormat(localeString, {
    style: 'percent',
    minimumFractionDigits: options.minimumFractionDigits ?? 1,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(value / 100);
};

// Relative time formatting
export const formatRelativeTime = (
  date: Date | string | number,
  language: SupportedLanguage = 'de'
): string => {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  const localeString = language === 'de' ? 'de-DE' : 'en-US';
  const rtf = new Intl.RelativeTimeFormat(localeString, { numeric: 'auto' });
  
  // Convert seconds to appropriate unit
  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];
  
  for (const { unit, seconds } of units) {
    if (Math.abs(diffInSeconds) >= seconds) {
      return rtf.format(-Math.floor(diffInSeconds / seconds), unit);
    }
  }
  
  return rtf.format(-diffInSeconds, 'second');
};

// Business-specific formatters
export const formatInvoiceNumber = (
  number: string | number,
  language: SupportedLanguage = 'de'
): string => {
  const prefix = language === 'de' ? 'RE-' : 'INV-';
  const numStr = typeof number === 'string' ? number : number.toString().padStart(4, '0');
  return `${prefix}${numStr}`;
};

export const formatCustomerNumber = (
  number: string | number,
  language: SupportedLanguage = 'de'
): string => {
  const prefix = language === 'de' ? 'KD-' : 'CU-';
  const numStr = typeof number === 'string' ? number : number.toString().padStart(4, '0');
  return `${prefix}${numStr}`;
};

export const formatProjectNumber = (
  number: string | number,
  language: SupportedLanguage = 'de'
): string => {
  const prefix = language === 'de' ? 'PR-' : 'PJ-';
  const numStr = typeof number === 'string' ? number : number.toString().padStart(4, '0');
  return `${prefix}${numStr}`;
};

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string, region: string = 'DE'): boolean => {
  // Basic phone validation - can be enhanced with libphonenumber
  const cleanPhone = phone.replace(/\s+/g, '');
  
  if (region === 'DE') {
    // German phone number validation
    return /^(\+49|0)[1-9][0-9]{6,14}$/.test(cleanPhone);
  } else {
    // US phone number validation
    return /^(\+1|1)?[2-9][0-9]{2}[2-9][0-9]{2}[0-9]{4}$/.test(cleanPhone);
  }
};

export const validateVATID = (vatId: string, country: string = 'DE'): boolean => {
  const cleanVatId = vatId.replace(/\s+/g, '').toUpperCase();
  
  if (country === 'DE') {
    // German VAT ID validation
    return /^DE[0-9]{9}$/.test(cleanVatId);
  } else {
    // Basic EU VAT ID validation
    return /^[A-Z]{2}[0-9A-Z]{2,12}$/.test(cleanVatId);
  }
};

// Language detection and switching
export const detectBrowserLanguage = (): SupportedLanguage => {
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'de' ? 'de' : 'en';
};

export const getLanguageFromLocale = (locale: string): SupportedLanguage => {
  const lang = locale.split('-')[0];
  return lang === 'de' ? 'de' : 'en';
};

// Pluralization helpers
export const pluralize = (
  count: number,
  singular: string,
  plural: string,
  language: SupportedLanguage = 'de'
): string => {
  if (language === 'de') {
    // German pluralization: 0 and 1 are singular, everything else is plural
    return count === 1 ? singular : plural;
  } else {
    // English pluralization: 1 is singular, everything else is plural
    return count === 1 ? singular : plural;
  }
};

// Text direction utilities
export const getTextDirection = (language: SupportedLanguage): 'ltr' | 'rtl' => {
  // Both German and English are left-to-right
  return 'ltr';
};

// Collation helpers for sorting
export const createCollator = (language: SupportedLanguage) => {
  const localeString = language === 'de' ? 'de-DE' : 'en-US';
  return new Intl.Collator(localeString, {
    sensitivity: 'base',
    numeric: true,
    ignorePunctuation: true,
  });
};

// Sort helper for localized strings
export const sortByLocale = <T>(
  items: T[],
  getValue: (item: T) => string,
  locale: SupportedLanguage = 'de'
): T[] => {
  const collator = createCollator(locale);
  return [...items].sort((a, b) => collator.compare(getValue(a), getValue(b)));
};

// Export commonly used formatters as a convenience object
export const formatters = {
  date: formatDate,
  currency: formatCurrency,
  number: formatNumber,
  percent: formatPercent,
  relativeTime: formatRelativeTime,
  invoiceNumber: formatInvoiceNumber,
  customerNumber: formatCustomerNumber,
  projectNumber: formatProjectNumber,
};