import { Navigate, useNavigate, useParams } from 'react-router-dom';
import ArticleDetail from '../components/ArticleDetail';

const ArticleDetailRoute = () => {
  const navigate = useNavigate();
  const { articleId } = useParams<{ articleId: string }>();

  if (!articleId) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <ArticleDetail
      articleId={articleId}
      onBack={() => navigate('/articles')}
      onInvoiceClick={(invoiceId) => navigate(`/invoices/${invoiceId}`)}
    />
  );
};

export default ArticleDetailRoute;
