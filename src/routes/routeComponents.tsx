import React, { useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type ComponentWithOptionalProps<P = unknown> = React.ComponentType<P>;

export const DashboardRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();

  const handleNavigate = useCallback((view: string) => {
    switch (view) {
      case 'invoice':
        navigate('/invoices');
        break;
      case 'invoice-new':
        navigate('/invoices/new');
        break;
      case 'customers':
        navigate('/customers');
        break;
      case 'projects':
        navigate('/projects');
        break;
      case 'reminders':
        navigate('/reminders');
        break;
      case 'invoice-upload':
        navigate('/invoices/upload');
        break;
      default:
        navigate('/');
    }
  }, [navigate]);

  const handleInvoiceClick = useCallback((invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
  }, [navigate]);

  return <Component onNavigate={handleNavigate} onInvoiceClick={handleInvoiceClick} />;
};

export const InvoiceOverviewRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();

  const handleInvoiceClick = useCallback((invoiceId: string) => {
    navigate(`/invoices/${invoiceId}`);
  }, [navigate]);

  return <Component onInvoiceClick={handleInvoiceClick} />;
};

export const InvoiceFormRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();

  return <Component onSuccess={() => navigate('/invoices')} />;
};

export const InvoiceAddRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();

  return <Component onBack={() => navigate('/invoices')} />;
};

export const InvoiceEditRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();
  const { invoiceId } = useParams<{ invoiceId?: string }>();

  useEffect(() => {
    if (!invoiceId) {
      navigate('/invoices');
    }
  }, [invoiceId, navigate]);

  if (!invoiceId) {
    return null;
  }

  return (
    <Component
      invoiceId={invoiceId}
      onBack={() => navigate(`/invoices/${invoiceId}`)}
    />
  );
};

export const InvoiceDetailRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();
  const { invoiceId } = useParams<{ invoiceId?: string }>();

  useEffect(() => {
    if (!invoiceId) {
      navigate('/invoices');
    }
  }, [invoiceId, navigate]);

  if (!invoiceId) {
    return null;
  }

  return (
    <Component
      invoiceId={invoiceId}
      onBack={() => navigate('/invoices')}
      onCustomerClick={(customerId: string) => navigate(`/customers/${customerId}`)}
      onProjectClick={(projectId: string) => navigate(`/projects/${projectId}`)}
      onEditClick={(targetInvoiceId: string) => navigate(`/invoices/${targetInvoiceId}/edit`)}
    />
  );
};

export const InvoiceUploadRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();

  return <Component onBack={() => navigate('/invoices')} />;
};

export const CustomerOverviewRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();

  return <Component onCustomerClick={(customerId: string) => navigate(`/customers/${customerId}`)} />;
};

export const CustomerDetailRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId?: string }>();

  useEffect(() => {
    if (!customerId) {
      navigate('/customers');
    }
  }, [customerId, navigate]);

  if (!customerId) {
    return null;
  }

  return <Component customerId={customerId} onBack={() => navigate('/customers')} />;
};

export const ArticleCatalogRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();

  return <Component onArticleClick={(articleId: string) => navigate(`/articles/${articleId}`)} />;
};

export const ArticleDetailRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();
  const { articleId } = useParams<{ articleId?: string }>();

  useEffect(() => {
    if (!articleId) {
      navigate('/articles');
    }
  }, [articleId, navigate]);

  if (!articleId) {
    return null;
  }

  return (
    <Component
      articleId={articleId}
      onBack={() => navigate('/articles')}
      onInvoiceClick={(invoiceId: string) => navigate(`/invoices/${invoiceId}`)}
    />
  );
};

export const ProjectOverviewRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();

  return <Component onProjectClick={(projectId: string) => navigate(`/projects/${projectId}`)} />;
};

export const ProjectDetailRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();

  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
    }
  }, [projectId, navigate]);

  if (!projectId) {
    return null;
  }

  return (
    <Component
      projectId={projectId}
      onBack={() => navigate('/projects')}
      onCustomerClick={(customerId: string) => navigate(`/customers/${customerId}`)}
    />
  );
};

export const RemindersRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => {
  const navigate = useNavigate();

  return <Component onInvoiceClick={(invoiceId: string) => navigate(`/invoices/${invoiceId}`)} />;
};

export const FinanceRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => (
  <Component />
);

export const SettingsRoute: React.FC<{ Component: ComponentWithOptionalProps<any> }> = ({ Component }) => (
  <Component />
);
