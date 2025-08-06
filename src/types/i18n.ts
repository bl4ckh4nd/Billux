import 'react-i18next';

// Import resource types for type safety
import type commonDE from '../locales/de/common.json';
import type navigationDE from '../locales/de/navigation.json';
import type invoiceDE from '../locales/de/invoice.json';
import type customerDE from '../locales/de/customer.json';
import type projectDE from '../locales/de/project.json';
import type articleDE from '../locales/de/article.json';
import type paymentDE from '../locales/de/payment.json';
import type analyticsDE from '../locales/de/analytics.json';

// Define the resources interface
export interface Resources {
  common: typeof commonDE;
  navigation: typeof navigationDE;
  invoice: typeof invoiceDE;
  customer: typeof customerDE;
  project: typeof projectDE;
  article: typeof articleDE;
  payment: typeof paymentDE;
  analytics: typeof analyticsDE;
}

// Extend react-i18next module for type safety
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: Resources;
    returnNull: false;
  }
}

// Language configuration types
export type SupportedLanguage = 'de' | 'en';

export interface LocalizationSettings {
  region: string;
  timezone: string;
  numberFormat: 'de' | 'en' | 'us';
  timeFormat: '12h' | '24h';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
}

export interface I18nConfig {
  language: SupportedLanguage;
  localization: LocalizationSettings;
}

// Default localization settings
export const defaultLocalizationSettings: LocalizationSettings = {
  region: 'DE',
  timezone: 'Europe/Berlin',
  numberFormat: 'de',
  timeFormat: '24h',
  firstDayOfWeek: 1,
};

// Language metadata
export const supportedLanguages: Record<SupportedLanguage, { name: string; nativeName: string; flag: string }> = {
  de: {
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
};

// Namespace list for type safety
export const namespaces = [
  'common',
  'navigation',
  'invoice',
  'customer',
  'project',
  'article',
  'payment',
  'analytics',
] as const;

export type Namespace = typeof namespaces[number];

// Translation key helpers
export type TranslationKey<T extends Namespace> = keyof Resources[T];

// Date/time formatting options
export interface DateFormatOptions {
  dateStyle?: 'short' | 'medium' | 'long' | 'full';
  timeStyle?: 'short' | 'medium' | 'long' | 'full';
  format?: string;
}

export interface NumberFormatOptions {
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}