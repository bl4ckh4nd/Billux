export type NavKey =
  | 'dashboard'
  | 'invoice'
  | 'invoice-upload'
  | 'customers'
  | 'articles'
  | 'finances'
  | 'reminders'
  | 'projects'
  | 'settings';

export const NAVIGATION_PATHS: Record<NavKey, string> = {
  dashboard: '/',
  invoice: '/invoices',
  'invoice-upload': '/invoices/upload',
  customers: '/customers',
  articles: '/articles',
  finances: '/finances',
  reminders: '/reminders',
  projects: '/projects',
  settings: '/settings',
};
