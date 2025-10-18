import { useNavigate } from 'react-router-dom';
import InvoiceAdd from '../components/InvoiceAdd';

const InvoiceAddRoute = () => {
  const navigate = useNavigate();

  return (
    <InvoiceAdd onBack={() => navigate('/invoices')} />
  );
};

export default InvoiceAddRoute;
