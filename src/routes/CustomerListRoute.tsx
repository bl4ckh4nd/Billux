import { useNavigate } from 'react-router-dom';
import CustomerDatabase from '../components/CustomerDatabase';

const CustomerListRoute = () => {
  const navigate = useNavigate();

  return (
    <CustomerDatabase onCustomerClick={(customerId) => navigate(`/customers/${customerId}`)} />
  );
};

export default CustomerListRoute;
