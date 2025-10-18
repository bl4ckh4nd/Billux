import { Navigate, useNavigate, useParams } from 'react-router-dom';
import InvoiceDetail from '../components/InvoiceDetailNew';

const InvoiceDetailRoute = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams<{ invoiceId: string }>();

  if (!invoiceId) {
    return <Navigate to="/invoices" replace />;
  }

  return (
    <InvoiceDetail
      invoiceId={invoiceId}
      onBack={() => navigate('/invoices')}
      onCustomerClick={(customerId) => navigate(`/customers/${customerId}`)}
      onProjectClick={(projectId) => navigate(`/projects/${projectId}`)}
      onEditClick={(id) => navigate(`/invoices/${id}/edit`)}
    />
  );
};

export default InvoiceDetailRoute;
