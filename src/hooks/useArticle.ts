import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Article } from '../types/article';

export const useArticle = (articleId: string | undefined) => {
  return useQuery<Article | undefined, Error>({
    queryKey: ['article', articleId],
    queryFn: () => articleId ? api.articles.get(articleId) : Promise.resolve(undefined),
    enabled: !!articleId,
    staleTime: 30000, // 30 seconds
  });
};