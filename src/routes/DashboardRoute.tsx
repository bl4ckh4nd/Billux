import { useNavigate } from 'react-router-dom';
import Dashboard from '../components/Dashboard';

const DashboardRoute = () => {
  const navigate = useNavigate();

  return (
    <Dashboard
      onCreateInvoice={() => navigate('/invoices/new')}
      onInvoicesNavigate={() => navigate('/invoices')}
      onCustomersNavigate={() => navigate('/customers')}
      onProjectsNavigate={() => navigate('/projects')}
      onInvoiceClick={(invoiceId) => navigate(`/invoices/${invoiceId}`)}
    />
  );
};

export default DashboardRoute;
