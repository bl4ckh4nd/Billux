import { Navigate, useNavigate, useParams } from 'react-router-dom';
import InvoiceEdit from '../components/InvoiceEdit';

const InvoiceEditRoute = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams<{ invoiceId: string }>();

  if (!invoiceId) {
    return <Navigate to="/invoices" replace />;
  }

  return (
    <InvoiceEdit
      invoiceId={invoiceId}
      onBack={() => navigate(`/invoices/${invoiceId}`)}
    />
  );
};

export default InvoiceEditRoute;
