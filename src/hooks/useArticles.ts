import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useArticleStore } from '../stores/articleStore';
import type { CreateArticleDTO, UpdateArticleDTO } from '../types/article';

export const useArticles = () => {
  const { setCachedArticles, isCacheValid, getAllArticles } = useArticleStore();
  
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const articles = await api.articles.getAll();
      setCachedArticles(articles);
      return articles;
    },
    initialData: () => {
      if (isCacheValid()) {
        return getAllArticles();
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  const { addOptimisticArticle, confirmOptimisticUpdate, revertOptimisticUpdate } = useArticleStore();
  
  return useMutation({
    mutationFn: async (data: CreateArticleDTO) => {
      const tempId = addOptimisticArticle(data);
      
      try {
        const newArticle = await api.articles.create(data);
        confirmOptimisticUpdate(tempId, newArticle.id, newArticle);
        return newArticle;
      } catch (error) {
        revertOptimisticUpdate(tempId);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();
  const { updateOptimisticArticle, revertOptimisticUpdate } = useArticleStore();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateArticleDTO }) => {
      const originalArticle = useArticleStore.getState().getArticleById(id);
      updateOptimisticArticle(id, data);
      
      try {
        const updatedArticle = await api.articles.update(id, data);
        return updatedArticle;
      } catch (error) {
        if (originalArticle) {
          updateOptimisticArticle(id, originalArticle);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();
  const { deleteOptimisticArticle, revertOptimisticUpdate } = useArticleStore();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const originalArticle = useArticleStore.getState().getArticleById(id);
      deleteOptimisticArticle(id);
      
      try {
        await api.articles.delete(id);
        return id;
      } catch (error) {
        if (originalArticle) {
          useArticleStore.getState().addOptimisticArticle(originalArticle);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
};
