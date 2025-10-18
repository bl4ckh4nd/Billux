import { Navigate, useNavigate, useParams } from 'react-router-dom';
import ProjectDetail from '../components/ProjectDetail';

const ProjectDetailRoute = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  if (!projectId) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <ProjectDetail
      projectId={projectId}
      onBack={() => navigate('/projects')}
      onCustomerClick={(customerId) => navigate(`/customers/${customerId}`)}
    />
  );
};

export default ProjectDetailRoute;
