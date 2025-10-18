import { useNavigate } from 'react-router-dom';
import InvoiceUploadPage from '../components/InvoiceUploadPage';

const InvoiceUploadRoute = () => {
  const navigate = useNavigate();

  return (
    <InvoiceUploadPage onBack={() => navigate('/invoices')} />
  );
};

export default InvoiceUploadRoute;
