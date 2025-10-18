import { Navigate, useNavigate, useParams } from 'react-router-dom';
import CustomerDetail from '../components/CustomerDetail';

const CustomerDetailRoute = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();

  if (!customerId) {
    return <Navigate to="/customers" replace />;
  }

  return (
    <CustomerDetail
      customerId={customerId}
      onBack={() => navigate('/customers')}
    />
  );
};

export default CustomerDetailRoute;
