import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Article, CreateArticleDTO } from '../types/article';

// Extend Article type for local state management
interface LocalArticle extends Article {
  deleted?: boolean;
}

interface ArticleCache {
  articles: Article[];
  lastFetch: string | null;
  isStale: boolean;
}

interface ArticleStore {
  // Cache management
  cache: ArticleCache;
  
  // Local state for immediate updates
  localArticles: LocalArticle[];
  
  // Optimistic updates tracking
  optimisticUpdates: Record<string, Partial<LocalArticle>>;
  
  // Actions
  setCachedArticles: (articles: Article[]) => void;
  addOptimisticArticle: (article: CreateArticleDTO) => string;
  updateOptimisticArticle: (id: string, article: Partial<Article>) => void;
  deleteOptimisticArticle: (id: string) => void;
  confirmOptimisticUpdate: (tempId: string, realId: string, article: Article) => void;
  revertOptimisticUpdate: (tempId: string) => void;
  clearOptimisticUpdates: () => void;
  
  // Cache utilities
  markCacheStale: () => void;
  isCacheValid: () => boolean;
  getAllArticles: () => Article[];
  getArticleById: (id: string) => Article | undefined;
  searchArticles: (query: string) => Article[];
  getArticlesByCategory: (category: string) => Article[];
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useArticleStore = create<ArticleStore>()(
  persist(
    (set, get) => ({
      cache: {
        articles: [],
        lastFetch: null,
        isStale: true,
      },
      localArticles: [],
      optimisticUpdates: {},
      
      setCachedArticles: (articles) => {
        set({
          cache: {
            articles,
            lastFetch: new Date().toISOString(),
            isStale: false,
          },
        });
      },
      
      addOptimisticArticle: (article) => {
        const tempId = `temp_${Math.random().toString(36).slice(2)}`;
        const newArticle: LocalArticle = {
          ...article,
          id: tempId,
        };
        
        set((state) => ({
          localArticles: [...state.localArticles, newArticle],
          optimisticUpdates: {
            ...state.optimisticUpdates,
            [tempId]: newArticle,
          },
        }));
        
        return tempId;
      },
      
      updateOptimisticArticle: (id, article) => {
        set((state) => {
          const updatedLocalArticles = state.localArticles.map(a =>
            a.id === id ? { ...a, ...article } : a
          );
          
          const updatedCachedArticles = state.cache.articles.map(a =>
            a.id === id ? { ...a, ...article } : a
          );
          
          return {
            localArticles: updatedLocalArticles,
            cache: {
              ...state.cache,
              articles: updatedCachedArticles,
            },
            optimisticUpdates: {
              ...state.optimisticUpdates,
              [id]: { ...state.optimisticUpdates[id], ...article },
            },
          };
        });
      },
      
      deleteOptimisticArticle: (id) => {
        set((state) => ({
          localArticles: state.localArticles.filter(a => a.id !== id),
          cache: {
            ...state.cache,
            articles: state.cache.articles.filter(a => a.id !== id),
          },
          optimisticUpdates: {
            ...state.optimisticUpdates,
            [id]: { ...state.optimisticUpdates[id], deleted: true },
          },
        }));
      },
      
      confirmOptimisticUpdate: (tempId, realId, article) => {
        set((state) => {
          const { [tempId]: removed, ...restOptimistic } = state.optimisticUpdates;
          
          const updatedLocalArticles = state.localArticles.map(a =>
            a.id === tempId ? { ...article, id: realId } : a
          );
          
          const updatedCachedArticles = state.cache.articles.map(a =>
            a.id === tempId ? { ...article, id: realId } : a
          );
          
          return {
            localArticles: updatedLocalArticles,
            cache: {
              ...state.cache,
              articles: updatedCachedArticles,
            },
            optimisticUpdates: restOptimistic,
          };
        });
      },
      
      revertOptimisticUpdate: (tempId) => {
        set((state) => {
          const { [tempId]: removed, ...restOptimistic } = state.optimisticUpdates;
          
          return {
            localArticles: state.localArticles.filter(a => a.id !== tempId),
            optimisticUpdates: restOptimistic,
          };
        });
      },
      
      clearOptimisticUpdates: () => {
        set({ optimisticUpdates: {}, localArticles: [] });
      },
      
      markCacheStale: () => {
        set((state) => ({
          cache: { ...state.cache, isStale: true },
        }));
      },
      
      isCacheValid: () => {
        const { cache } = get();
        if (!cache.lastFetch || cache.isStale) return false;
        
        const now = new Date().getTime();
        const fetchTime = new Date(cache.lastFetch).getTime();
        return (now - fetchTime) < CACHE_DURATION;
      },
      
      getAllArticles: () => {
        const { cache, localArticles } = get();
        const allArticles = [...cache.articles, ...localArticles];
        
        // Remove duplicates (prefer local over cached)
        const uniqueArticles = Array.from(
          new Map(allArticles.map(article => [article.id, article])).values()
        );
        
        return uniqueArticles.filter(article => !article.deleted);
      },
      
      getArticleById: (id) => {
        const allArticles = get().getAllArticles();
        return allArticles.find(article => article.id === id);
      },
      
      searchArticles: (query) => {
        const allArticles = get().getAllArticles();
        const searchTerm = query.toLowerCase();
        
        return allArticles.filter(article =>
          article.name.toLowerCase().includes(searchTerm) ||
          article.description?.toLowerCase().includes(searchTerm) ||
          article.category?.toLowerCase().includes(searchTerm)
        );
      },
      
      getArticlesByCategory: (category) => {
        const allArticles = get().getAllArticles();
        return allArticles.filter(article => article.category === category);
      },
    }),
    {
      name: 'article-store',
      partialize: (state) => ({
        cache: state.cache,
        localArticles: state.localArticles,
      }),
    }
  )
);