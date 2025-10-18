import { useQuery } from '@tanstack/react-query';
import { orpc } from '../lib/api';
import type { Article } from '../types/article';

export const useArticle = (articleId: string | undefined) => {
  return useQuery({
    ...orpc.articles.get.queryOptions({
      input: articleId ? { id: articleId } : undefined,
      enabled: !!articleId,
      staleTime: 30000
    })
  });
};