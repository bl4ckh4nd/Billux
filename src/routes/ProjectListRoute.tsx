import { useNavigate } from 'react-router-dom';
import ProjectOverview from '../components/ProjectOverview';

const ProjectListRoute = () => {
  const navigate = useNavigate();

  return (
    <ProjectOverview onProjectClick={(projectId) => navigate(`/projects/${projectId}`)} />
  );
};

export default ProjectListRoute;
