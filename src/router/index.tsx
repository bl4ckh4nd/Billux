import React, { useEffect } from 'react';
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import App from '../App';
import Dashboard from '../components/Dashboard';
import InvoiceOverview from '../components/InvoiceOverview';
import InvoiceAdd from '../components/InvoiceAdd';
import InvoiceDetail from '../components/InvoiceDetailNew';
import InvoiceEdit from '../components/InvoiceEdit';
import InvoiceUploadPage from '../components/InvoiceUploadPage';
import CustomerDatabase from '../components/CustomerDatabase';
import CustomerDetail from '../components/CustomerDetail';
import ArticleCatalog from '../components/ArticleCatalog';
import ArticleDetail from '../components/ArticleDetail';
import ProjectOverview from '../components/ProjectOverview';
import ProjectDetail from '../components/ProjectDetail';
import Reminders from '../components/Reminders';
import Finance from '../components/Finance';
import SettingsForm from '../components/settings/SettingsForm';
import { PageMeta, setLayoutPageMeta } from '../stores/layoutStore';

export interface LayoutContext {
  setPageMeta: (meta: PageMeta) => void;
}

const rootMeta: PageMeta = {
  navKey: 'dashboard',
  titleKey: 'navigation:pageTitle.dashboard',
  namespaceKey: 'dashboard',
};

export const Route = createRootRouteWithContext<LayoutContext>()({
  component: App,
  meta: rootMeta,
});

const usePageMeta = (meta: PageMeta) => {
  const { setPageMeta } = Route.useRouteContext();

  useEffect(() => {
    setPageMeta(meta);
  }, [setPageMeta, meta.navKey, meta.namespaceKey, meta.titleKey]);
};

const dashboardMeta: PageMeta = {
  navKey: 'dashboard',
  titleKey: 'navigation:pageTitle.dashboard',
  namespaceKey: 'dashboard',
};

const DashboardRouteComponent = () => {
  usePageMeta(dashboardMeta);
  const navigate = useNavigate();

  return (
    <Dashboard
      onNavigate={(view) => {
        switch (view) {
          case 'invoice-new':
            navigate({ to: '/invoices/new' });
            break;
          case 'customers':
            navigate({ to: '/customers' });
            break;
          case 'invoice':
            navigate({ to: '/invoices' });
            break;
          case 'projects':
            navigate({ to: '/projects' });
            break;
          default:
            break;
        }
      }}
      onInvoiceClick={(invoiceId) =>
        navigate({ to: '/invoices/$invoiceId', params: { invoiceId } })
      }
    />
  );
};

const invoicesMeta: PageMeta = {
  navKey: 'invoice',
  titleKey: 'navigation:pageTitle.invoices',
  namespaceKey: 'invoice',
};

const InvoicesRouteComponent = () => {
  usePageMeta(invoicesMeta);
  const navigate = useNavigate();

  return (
    <InvoiceOverview
      onInvoiceClick={(invoiceId) =>
        navigate({ to: '/invoices/$invoiceId', params: { invoiceId } })
      }
    />
  );
};

const invoiceNewMeta: PageMeta = {
  navKey: 'invoice',
  titleKey: 'navigation:pageTitle.invoices',
  namespaceKey: 'invoice-new',
};

const InvoiceNewRouteComponent = () => {
  usePageMeta(invoiceNewMeta);
  const navigate = useNavigate();

  return (
    <InvoiceAdd onBack={() => navigate({ to: '/invoices' })} />
  );
};

const invoiceDetailMeta: PageMeta = {
  navKey: 'invoice',
  titleKey: 'navigation:pageTitle.invoices',
  namespaceKey: 'invoice-detail',
};

const InvoiceDetailRouteComponent = () => {
  usePageMeta(invoiceDetailMeta);
  const navigate = useNavigate();
  const { invoiceId } = useParams({ from: '/invoices/$invoiceId' as const });

  return (
    <InvoiceDetail
      invoiceId={invoiceId}
      onBack={() => navigate({ to: '/invoices' })}
      onCustomerClick={(customerId) =>
        navigate({ to: '/customers/$customerId', params: { customerId } })
      }
      onProjectClick={(projectId) =>
        navigate({ to: '/projects/$projectId', params: { projectId } })
      }
      onEditClick={(id) =>
        navigate({ to: '/invoices/$invoiceId/edit', params: { invoiceId: id } })
      }
    />
  );
};

const invoiceEditMeta: PageMeta = {
  navKey: 'invoice',
  titleKey: 'navigation:pageTitle.invoices',
  namespaceKey: 'invoice-edit',
};

const InvoiceEditRouteComponent = () => {
  usePageMeta(invoiceEditMeta);
  const navigate = useNavigate();
  const { invoiceId } = useParams({ from: '/invoices/$invoiceId/edit' as const });

  return (
    <InvoiceEdit
      invoiceId={invoiceId}
      onBack={() => navigate({ to: '/invoices/$invoiceId', params: { invoiceId } })}
    />
  );
};

const invoiceUploadMeta: PageMeta = {
  navKey: 'invoice-upload',
  titleKey: 'navigation:pageTitle.invoiceUpload',
  namespaceKey: 'invoice-upload',
};

const InvoiceUploadRouteComponent = () => {
  usePageMeta(invoiceUploadMeta);
  const navigate = useNavigate();

  return <InvoiceUploadPage onBack={() => navigate({ to: '/invoices' })} />;
};

const customersMeta: PageMeta = {
  navKey: 'customers',
  titleKey: 'navigation:pageTitle.customers',
  namespaceKey: 'customers',
};

const CustomersRouteComponent = () => {
  usePageMeta(customersMeta);
  const navigate = useNavigate();

  return (
    <CustomerDatabase
      onCustomerClick={(customerId) =>
        navigate({ to: '/customers/$customerId', params: { customerId } })
      }
    />
  );
};

const customerDetailMeta: PageMeta = {
  navKey: 'customers',
  titleKey: 'navigation:pageTitle.customers',
  namespaceKey: 'customer-detail',
};

const CustomerDetailRouteComponent = () => {
  usePageMeta(customerDetailMeta);
  const navigate = useNavigate();
  const { customerId } = useParams({ from: '/customers/$customerId' as const });

  return (
    <CustomerDetail
      customerId={customerId}
      onBack={() => navigate({ to: '/customers' })}
    />
  );
};

const articlesMeta: PageMeta = {
  navKey: 'articles',
  titleKey: 'navigation:pageTitle.articles',
  namespaceKey: 'articles',
};

const ArticlesRouteComponent = () => {
  usePageMeta(articlesMeta);
  const navigate = useNavigate();

  return (
    <ArticleCatalog
      onArticleClick={(articleId) =>
        navigate({ to: '/articles/$articleId', params: { articleId } })
      }
    />
  );
};

const articleDetailMeta: PageMeta = {
  navKey: 'articles',
  titleKey: 'navigation:pageTitle.articles',
  namespaceKey: 'article-detail',
};

const ArticleDetailRouteComponent = () => {
  usePageMeta(articleDetailMeta);
  const navigate = useNavigate();
  const { articleId } = useParams({ from: '/articles/$articleId' as const });

  return (
    <ArticleDetail
      articleId={articleId}
      onBack={() => navigate({ to: '/articles' })}
      onInvoiceClick={(invoiceId) =>
        navigate({ to: '/invoices/$invoiceId', params: { invoiceId } })
      }
    />
  );
};

const projectsMeta: PageMeta = {
  navKey: 'projects',
  titleKey: 'navigation:pageTitle.projects',
  namespaceKey: 'projects',
};

const ProjectsRouteComponent = () => {
  usePageMeta(projectsMeta);
  const navigate = useNavigate();

  return (
    <ProjectOverview
      onProjectClick={(projectId) =>
        navigate({ to: '/projects/$projectId', params: { projectId } })
      }
    />
  );
};

const projectDetailMeta: PageMeta = {
  navKey: 'projects',
  titleKey: 'navigation:pageTitle.projects',
  namespaceKey: 'project-detail',
};

const ProjectDetailRouteComponent = () => {
  usePageMeta(projectDetailMeta);
  const navigate = useNavigate();
  const { projectId } = useParams({ from: '/projects/$projectId' as const });

  return (
    <ProjectDetail
      projectId={projectId}
      onBack={() => navigate({ to: '/projects' })}
      onCustomerClick={(customerId) =>
        navigate({ to: '/customers/$customerId', params: { customerId } })
      }
    />
  );
};

const remindersMeta: PageMeta = {
  navKey: 'reminders',
  titleKey: 'navigation:pageTitle.reminders',
  namespaceKey: 'reminders',
};

const RemindersRouteComponent = () => {
  usePageMeta(remindersMeta);
  const navigate = useNavigate();

  return (
    <Reminders
      onInvoiceClick={(invoiceId) =>
        navigate({ to: '/invoices/$invoiceId', params: { invoiceId } })
      }
    />
  );
};

const financesMeta: PageMeta = {
  navKey: 'finances',
  titleKey: 'navigation:pageTitle.finances',
  namespaceKey: 'finances',
};

const FinancesRouteComponent = () => {
  usePageMeta(financesMeta);
  return <Finance />;
};

const settingsMeta: PageMeta = {
  navKey: 'settings',
  titleKey: 'navigation:pageTitle.settings',
  namespaceKey: 'settings',
};

const SettingsRouteComponent = () => {
  usePageMeta(settingsMeta);
  return <SettingsForm />;
};

const dashboardRoute = createRoute({
  getParentRoute: () => Route,
  path: '/',
  meta: dashboardMeta,
  component: DashboardRouteComponent,
});

const invoicesRoute = createRoute({
  getParentRoute: () => Route,
  path: 'invoices',
  meta: invoicesMeta,
  component: InvoicesRouteComponent,
});

const invoiceNewRoute = createRoute({
  getParentRoute: () => Route,
  path: 'invoices/new',
  meta: invoiceNewMeta,
  component: InvoiceNewRouteComponent,
});

const invoiceDetailRoute = createRoute({
  getParentRoute: () => Route,
  path: 'invoices/$invoiceId',
  meta: invoiceDetailMeta,
  component: InvoiceDetailRouteComponent,
});

const invoiceEditRoute = createRoute({
  getParentRoute: () => Route,
  path: 'invoices/$invoiceId/edit',
  meta: invoiceEditMeta,
  component: InvoiceEditRouteComponent,
});

const invoiceUploadRoute = createRoute({
  getParentRoute: () => Route,
  path: 'invoices/upload',
  meta: invoiceUploadMeta,
  component: InvoiceUploadRouteComponent,
});

const customersRoute = createRoute({
  getParentRoute: () => Route,
  path: 'customers',
  meta: customersMeta,
  component: CustomersRouteComponent,
});

const customerDetailRoute = createRoute({
  getParentRoute: () => Route,
  path: 'customers/$customerId',
  meta: customerDetailMeta,
  component: CustomerDetailRouteComponent,
});

const articlesRoute = createRoute({
  getParentRoute: () => Route,
  path: 'articles',
  meta: articlesMeta,
  component: ArticlesRouteComponent,
});

const articleDetailRoute = createRoute({
  getParentRoute: () => Route,
  path: 'articles/$articleId',
  meta: articleDetailMeta,
  component: ArticleDetailRouteComponent,
});

const projectsRoute = createRoute({
  getParentRoute: () => Route,
  path: 'projects',
  meta: projectsMeta,
  component: ProjectsRouteComponent,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => Route,
  path: 'projects/$projectId',
  meta: projectDetailMeta,
  component: ProjectDetailRouteComponent,
});

const remindersRoute = createRoute({
  getParentRoute: () => Route,
  path: 'reminders',
  meta: remindersMeta,
  component: RemindersRouteComponent,
});

const financesRoute = createRoute({
  getParentRoute: () => Route,
  path: 'finances',
  meta: financesMeta,
  component: FinancesRouteComponent,
});

const settingsRoute = createRoute({
  getParentRoute: () => Route,
  path: 'settings',
  meta: settingsMeta,
  component: SettingsRouteComponent,
});

const routeTree = Route.addChildren([
  dashboardRoute,
  invoicesRoute,
  invoiceNewRoute,
  invoiceDetailRoute,
  invoiceEditRoute,
  invoiceUploadRoute,
  customersRoute,
  customerDetailRoute,
  articlesRoute,
  articleDetailRoute,
  projectsRoute,
  projectDetailRoute,
  remindersRoute,
  financesRoute,
  settingsRoute,
]);

export const router = createRouter({
  routeTree,
  context: {
    setPageMeta: (meta) => setLayoutPageMeta(meta),
  },
  defaultPreload: 'intent',
});

export type AppRouter = typeof router;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
    routeMeta: PageMeta;
  }
}

export { routeTree };
