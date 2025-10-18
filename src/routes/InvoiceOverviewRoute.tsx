import { useNavigate } from 'react-router-dom';
import InvoiceOverview from '../components/InvoiceOverview';

const InvoiceOverviewRoute = () => {
  const navigate = useNavigate();

  return (
    <InvoiceOverview
      onInvoiceClick={(invoiceId) => navigate(`/invoices/${invoiceId}`)}
      onCreateInvoice={() => navigate('/invoices/new')}
    />
  );
};

export default InvoiceOverviewRoute;
