import { useNavigate } from 'react-router-dom';
import InvoiceForm from '../components/InvoiceForm';

const InvoiceCreateRoute = () => {
  const navigate = useNavigate();

  return (
    <InvoiceForm onSuccess={() => navigate('/invoices')} />
  );
};

export default InvoiceCreateRoute;
