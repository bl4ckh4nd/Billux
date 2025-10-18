import { useNavigate } from 'react-router-dom';
import Reminders from '../components/Reminders';

const RemindersRoute = () => {
  const navigate = useNavigate();

  return (
    <Reminders onInvoiceClick={(invoiceId) => navigate(`/invoices/${invoiceId}`)} />
  );
};

export default RemindersRoute;
