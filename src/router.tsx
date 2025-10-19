import { createBrowserRouter } from 'react-router-dom';

import App from './App';
import Dashboard from './components/Dashboard';
import InvoiceOverview from './components/InvoiceOverview';
import InvoiceForm from './components/InvoiceForm';
import InvoiceAdd from './components/InvoiceAdd';
import InvoiceEdit from './components/InvoiceEdit';
import InvoiceDetail from './components/InvoiceDetailNew';
import InvoiceUploadPage from './components/InvoiceUploadPage';
import CustomerDatabase from './components/CustomerDatabase';
import CustomerDetail from './components/CustomerDetail';
import ArticleCatalog from './components/ArticleCatalog';
import ArticleDetail from './components/ArticleDetail';
import ProjectOverview from './components/ProjectOverview';
import ProjectDetail from './components/ProjectDetail';
import Reminders from './components/Reminders';
import Finance from './components/Finance';
import SettingsForm from './components/settings/SettingsForm';

import type { AppRouteHandle } from './routes/types';

import {
  CustomerDetailRoute,
  CustomerOverviewRoute,
  DashboardRoute,
  InvoiceAddRoute,
  InvoiceDetailRoute,
  InvoiceEditRoute,
  InvoiceFormRoute,
  InvoiceOverviewRoute,
  InvoiceUploadRoute,
  ProjectDetailRoute,
  ProjectOverviewRoute,
  RemindersRoute,
  ArticleCatalogRoute,
  ArticleDetailRoute,
  FinanceRoute,
  SettingsRoute,
} from './routes/routeComponents';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    handle: {
      navKey: 'dashboard',
      titleKey: 'pageTitle.dashboard',
      namespaceKey: 'dashboard',
    } satisfies AppRouteHandle,
    children: [
      {
        index: true,
        element: <DashboardRoute Component={Dashboard} />,
        handle: {
          navKey: 'dashboard',
          titleKey: 'pageTitle.dashboard',
          namespaceKey: 'dashboard',
        } satisfies AppRouteHandle,
      },
      {
        path: 'invoices',
        element: <InvoiceOverviewRoute Component={InvoiceOverview} />,
        handle: {
          navKey: 'invoice',
          titleKey: 'pageTitle.invoices',
          namespaceKey: 'invoice',
        } satisfies AppRouteHandle,
      },
      {
        path: 'invoices/new',
        element: <InvoiceFormRoute Component={InvoiceForm} />,
        handle: {
          navKey: 'invoice',
          titleKey: 'pageTitle.invoices',
          namespaceKey: 'invoice-new',
        } satisfies AppRouteHandle,
      },
      {
        path: 'invoices/add',
        element: <InvoiceAddRoute Component={InvoiceAdd} />,
        handle: {
          navKey: 'invoice',
          titleKey: 'pageTitle.invoices',
          namespaceKey: 'invoice-add',
        } satisfies AppRouteHandle,
      },
      {
        path: 'invoices/upload',
        element: <InvoiceUploadRoute Component={InvoiceUploadPage} />,
        handle: {
          navKey: 'invoice-upload',
          titleKey: 'pageTitle.invoiceUpload',
          namespaceKey: 'invoice-upload',
        } satisfies AppRouteHandle,
      },
      {
        path: 'invoices/:invoiceId',
        element: <InvoiceDetailRoute Component={InvoiceDetail} />,
        handle: {
          navKey: 'invoice',
          titleKey: 'pageTitle.invoices',
          namespaceKey: 'invoice-detail',
        } satisfies AppRouteHandle,
      },
      {
        path: 'invoices/:invoiceId/edit',
        element: <InvoiceEditRoute Component={InvoiceEdit} />,
        handle: {
          navKey: 'invoice',
          titleKey: 'pageTitle.invoices',
          namespaceKey: 'invoice-edit',
        } satisfies AppRouteHandle,
      },
      {
        path: 'customers',
        element: <CustomerOverviewRoute Component={CustomerDatabase} />,
        handle: {
          navKey: 'customers',
          titleKey: 'pageTitle.customers',
          namespaceKey: 'customers',
        } satisfies AppRouteHandle,
      },
      {
        path: 'customers/:customerId',
        element: <CustomerDetailRoute Component={CustomerDetail} />,
        handle: {
          navKey: 'customers',
          titleKey: 'pageTitle.customers',
          namespaceKey: 'customer-detail',
        } satisfies AppRouteHandle,
      },
      {
        path: 'articles',
        element: <ArticleCatalogRoute Component={ArticleCatalog} />,
        handle: {
          navKey: 'articles',
          titleKey: 'pageTitle.articles',
          namespaceKey: 'articles',
        } satisfies AppRouteHandle,
      },
      {
        path: 'articles/:articleId',
        element: <ArticleDetailRoute Component={ArticleDetail} />,
        handle: {
          navKey: 'articles',
          titleKey: 'pageTitle.articles',
          namespaceKey: 'article-detail',
        } satisfies AppRouteHandle,
      },
      {
        path: 'projects',
        element: <ProjectOverviewRoute Component={ProjectOverview} />,
        handle: {
          navKey: 'projects',
          titleKey: 'pageTitle.projects',
          namespaceKey: 'projects',
        } satisfies AppRouteHandle,
      },
      {
        path: 'projects/:projectId',
        element: <ProjectDetailRoute Component={ProjectDetail} />,
        handle: {
          navKey: 'projects',
          titleKey: 'pageTitle.projects',
          namespaceKey: 'project-detail',
        } satisfies AppRouteHandle,
      },
      {
        path: 'reminders',
        element: <RemindersRoute Component={Reminders} />,
        handle: {
          navKey: 'reminders',
          titleKey: 'pageTitle.reminders',
          namespaceKey: 'reminders',
        } satisfies AppRouteHandle,
      },
      {
        path: 'finances',
        element: <FinanceRoute Component={Finance} />,
        handle: {
          navKey: 'finances',
          titleKey: 'pageTitle.finances',
          namespaceKey: 'finances',
        } satisfies AppRouteHandle,
      },
      {
        path: 'settings',
        element: <SettingsRoute Component={SettingsForm} />,
        handle: {
          navKey: 'settings',
          titleKey: 'pageTitle.settings',
          namespaceKey: 'settings',
        } satisfies AppRouteHandle,
      },
    ],
  },
]);

export default router;
