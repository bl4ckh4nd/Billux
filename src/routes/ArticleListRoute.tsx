import { useNavigate } from 'react-router-dom';
import ArticleCatalog from '../components/ArticleCatalog';

const ArticleListRoute = () => {
  const navigate = useNavigate();

  return (
    <ArticleCatalog onArticleClick={(articleId) => navigate(`/articles/${articleId}`)} />
  );
};

export default ArticleListRoute;
